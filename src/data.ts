import parse from "csv-parse";
import fs, {promises as fsP} from "fs";
import path from "path";

import {
  companyDetails as companyDetails2,
  emptyCompany,
  processHtml,
} from "./formatter";
import {fetchDocumentHtml, getAuth, listFiles} from "./google";
import {
  CompanyDetails,
  CompanyIndex,
  CompanyKind,
  CsvRecord,
  Element,
  ElementValue,
  IndexYear,
  Indicator,
  IndicatorCategory,
  IndicatorIndex,
  IndicatorScore,
  Scores,
} from "./types";
import {
  floatOrNA,
  isIndicatorFamily,
  mapBoolean,
  mapCategory,
  mapElementValue,
  memoizeAsync,
  stringOrNil,
  unreachable,
} from "./utils";

type CsvTotal = {
  index: IndexYear;
  company: string;
  score: IndicatorScore;
};

type CsvCategory = {
  index: IndexYear;
  company: string;
  category: IndicatorCategory;
  score: IndicatorScore;
};

type CsvIndicator = {
  index: IndexYear;
  company: string;
  category: IndicatorCategory;
  indicator: string;
  indicatorNr: number;
  indicatorSuffix?: string;
  score: IndicatorScore;
  label: string;
  description: string;
  isFamilyMember: boolean;
  indicatorFamily: string;
};

type CsvLevel = {
  index: IndexYear;
  company: string;
  category: IndicatorCategory;
  indicator: string;
  indicatorNr: number;
  indicatorSuffix?: string;
  score: IndicatorScore;
  kind: string;
  service: string;
};

type CsvElement = {
  index: IndexYear;
  company: string;
  category: IndicatorCategory;
  indicator: string;
  element: string;
  indicatorNr: number;
  indicatorSuffix?: string;
  elementNr: number;
  score: IndicatorScore;
  value: ElementValue;
  kind: string;
  service: string;
};

type CsvCompanySpec = {
  company: string;
  companyPretty: string;
  kind: CompanyKind;
  country: string;
};

type CsvIndicatorSpec = {
  category: IndicatorCategory;
  indicator: string;
  display: string;
  indicatorNr: number;
  indicatorSuffix?: string;
  label: string;
  description: string;
  guidance: string;
  isParent: boolean;
};

type CsvElementSpec = {
  category: IndicatorCategory;
  indicator: string;
  element: string;
  indicatorNr: number;
  elementNr: number;
  label: string;
  description: string;
};

/*
 * The years we include in the data extraction.
 */
const indexYears: Set<IndexYear> = new Set(["2020"]);

/*
 * The ID's of the Google Drive folders. Maybe move this into some
 * configuration file?
 */
const companiesFolder = "1aByjKhv9N9nNQBRNK1GVdraU0qorv7dX";

/* A helper function to extract and map indicators for one category
 * from a list of indicators. This is used by the loadData function.
 */
const categoryIndicators = (
  csvIndicators: CsvIndicator[],
  specs: CsvIndicatorSpec[],
): Indicator[] => {
  const iterator = (
    indicators: CsvIndicator[],
    skipFamilyMembers: boolean,
  ): Indicator[] => {
    return indicators
      .sort((a, b) => {
        if (a.indicator < b.indicator) return -1;
        if (a.indicator > b.indicator) return 1;
        return 0;
      })
      .filter(({isFamilyMember}) => skipFamilyMembers === isFamilyMember)
      .map((indicator) => {
        const {label, description, guidance, display} =
          specs.find((r) => r.indicator === indicator.indicator) ||
          unreachable(`Indicator ${indicator.indicator} not found in specs.`);

        const familyMembers = csvIndicators.filter(
          ({isFamilyMember, indicatorFamily}) =>
            indicatorFamily === indicator.indicator && isFamilyMember,
        );

        const score: IndicatorScore =
          indicator.score === "NA" ? "NA" : indicator.score;

        return {
          category: indicator.category,
          indicator: indicator.indicator,
          indicatorNr: indicator.indicatorNr,
          score,
          label,
          description,
          guidance,
          display,
          familyMembers: iterator(familyMembers, true),
          ...(indicator.indicatorSuffix
            ? {indicatorSuffix: indicator.indicatorSuffix}
            : undefined),
        };
      });
  };

  return iterator(csvIndicators, false);
};

/*
 * Load Records from a CSV file and map them to a useful type.
 */
const loadCsv = <T extends Record<string, unknown>>(
  mapper: (record: CsvRecord) => T,
): ((f: string) => Promise<T[]>) => async (file: string): Promise<T[]> => {
  const data: T[] = [];

  const source = fs.createReadStream(path.join(process.cwd(), file));

  const parser = parse({columns: true});

  parser.on("readable", () => {
    let record;
    // eslint-disable-next-line no-cond-assign
    while ((record = parser.read())) {
      data.push(mapper(record));
    }
  });

  return new Promise((resolve, reject) => {
    parser.on("error", reject);
    parser.on("end", () => resolve(data));
    source.pipe(parser);
  });
};

/*
 * Load the scores for every company from a CSV.
 */
const loadTotalsCsv = loadCsv<CsvTotal>((record) => ({
  index: record.Index as IndexYear,
  company: record.Company,
  score: floatOrNA(record.Score),
}));

/*
 * Load the scores for every category and each company from a CSV.
 */
const loadCategoriesCsv = loadCsv<CsvCategory>((record) => ({
  index: record.Index as IndexYear,
  company: record.Company,
  category: mapCategory(record.Category),
  score: floatOrNA(record.Score),
}));

/*
 * Load the scores for every indicator for each category and company from a CSV.
 */
const loadIndicatorsCsv = loadCsv<CsvIndicator>((record) => ({
  index: record.Index as IndexYear,
  company: record.Company,
  category: mapCategory(record.Category),
  indicator: record.Indicator,
  indicatorNr: Number.parseInt(record.IndicatorNr, 10),
  indicatorSuffix: stringOrNil(record.IndicatorSuffix),
  score: floatOrNA(record.Score),
  label: record.labelLong,
  description: record.description,
  isFamilyMember: isIndicatorFamily(record.isSubindicator),
  indicatorFamily: record.IndicatorFam,
}));

/*
 * Load the all elements for each company and indicator from a CSV.
 */
const loadLevelsCsv = loadCsv<CsvLevel>((record) => ({
  index: record.Index as IndexYear,
  company: record.Company,
  category: mapCategory(record.Category),
  indicator: record.Indicator,
  indicatorNr: Number.parseInt(record.IndicatorNr, 10),
  indicatorSuffix: stringOrNil(record.IndicatorSuffix),
  score: floatOrNA(record.Score),
  kind: record.Class,
  service: record.Service,
}));

/*
 * Load the all elements for each company and indicator from a CSV.
 */
const loadElementsCsv = loadCsv<CsvElement>((record) => ({
  index: record.Index as IndexYear,
  company: record.Company,
  category: mapCategory(record.Category),
  indicator: record.Indicator,
  element: record.Element,
  indicatorNr: Number.parseInt(record.IndicatorNr, 10),
  indicatorSuffix: stringOrNil(record.IndicatorSuffix),
  elementNr: Number.parseInt(record.ElemNr, 10),
  score: floatOrNA(record.Score),
  value: mapElementValue(record.Value),
  kind: record.Class,
  service: record.Service,
}));

/*
 * Load the company specs.
 */
const loadCompanySpecsCsv = loadCsv<CsvCompanySpec>((record) => ({
  company: record.companyClean,
  companyPretty: record.company,
  kind: record.maintype === "platforms" ? "internet" : "telecom",
  country: record.country,
}));

/*
 * Load the indicator specs.
 */
const loadIndicatorSpecsCsv = loadCsv<CsvIndicatorSpec>((record) => ({
  category: mapCategory(record.Category),
  indicator: record.Indicator,
  display: record.labelShort,
  indicatorNr: Number.parseInt(record.indicatorNr, 10),
  indicatorSuffix: stringOrNil(record.indicatorSuffix),
  label: record.labelLong,
  description: record.description,
  guidance: record.guidance,
  isParent: mapBoolean(record.isParent),
}));

/*
 * Load the elements specs.
 */
const loadElementSpecsCsv = loadCsv<CsvElementSpec>((record) => ({
  category: mapCategory(record.Category),
  indicator: record.Indicator,
  element: record.Element,
  indicatorNr: Number.parseInt(record.indicatorNr, 10),
  elementNr: Number.parseInt(record.elemNr, 10),
  label: record.labelShort,
  description: record.description,
}));

/*
 * Load the source data and construct the company index for 2020. This
 * function is called to populate the website pages.
 */
export const companyIndices = memoizeAsync<() => Promise<CompanyIndex[]>>(
  async () => {
    const [
      csvTotals,
      csvCategories,
      csvIndicators,
      csvCompanySpecs,
      csvIndicatorSpecs,
    ] = await Promise.all([
      loadTotalsCsv("data/2020-totals.csv"),
      loadCategoriesCsv("data/2020-categories.csv"),
      loadIndicatorsCsv("data/2020-indicators.csv"),
      loadCompanySpecsCsv("data/2020-company-specs.csv"),
      loadIndicatorSpecsCsv("data/2020-indicator-specs.csv"),
    ]);

    return (
      csvTotals
        .filter((total) => total.score && indexYears.has(total.index))
        .map((total) => {
          const companySpec =
            csvCompanySpecs.find((r) => r.company === total.company) ||
            unreachable(`Company ${total.company} not found in specs.`);

          const companyCategories = csvCategories.filter(
            (category) =>
              category.company === total.company &&
              indexYears.has(category.index),
          );
          const companyIndicators = csvIndicators.filter(
            (indicator) =>
              indicator.company === total.company &&
              indexYears.has(indicator.index),
          );

          const scores: Scores = companyCategories.reduce(
            (memo, category) =>
              category.score === undefined
                ? memo
                : Object.assign(memo, {[category.category]: category.score}),
            {
              total: total.score,
              governance: 0,
              freedom: 0,
              privacy: 0,
            } as Scores,
          );

          const governanceIndicators: Indicator[] = categoryIndicators(
            companyIndicators.filter(
              (indicator) => indicator.category === "governance",
            ),
            csvIndicatorSpecs,
          );
          const freedomIndicators: Indicator[] = categoryIndicators(
            companyIndicators.filter(
              (indicator) => indicator.category === "freedom",
            ),
            csvIndicatorSpecs,
          );
          const privacyIndicators: Indicator[] = categoryIndicators(
            companyIndicators.filter(
              (indicator) => indicator.category === "privacy",
            ),
            csvIndicatorSpecs,
          );

          return {
            id: companySpec.company,
            index: total.index,
            company: companySpec.company,
            companyPretty: companySpec.companyPretty,
            rank: -1, // We set the real rank further below
            kind: companySpec.kind,
            country: companySpec.country,
            scores,
            indicators: {
              governance: governanceIndicators,
              freedom: freedomIndicators,
              privacy: privacyIndicators,
            },
          };
        })
        // Set the real rank of the company after we sorted the
        // companies by score.
        .sort((a, b) => {
          if (a.scores.total < b.scores.total) return -1;
          if (a.scores.total > b.scores.total) return 1;
          return 0;
        })
        .map((company, i) => Object.assign(company, {rank: i + 1}))
    );
  },
);

/*
 * Load the source data and construct the indicator index for 2020. This
 * function is called to populate the website pages.
 */
export const indicatorIndices = memoizeAsync<() => Promise<IndicatorIndex[]>>(
  async () => {
    const [
      csvIndicators,
      csvLevels,
      csvElements,
      csvIndicatorSpecs,
      csvElementSpecs,
    ] = await Promise.all([
      loadIndicatorsCsv("data/2020-indicators.csv"),
      loadLevelsCsv("data/2020-levels.csv"),
      loadElementsCsv("data/2020-elements.csv"),
      loadIndicatorSpecsCsv("data/2020-indicator-specs.csv"),
      loadElementSpecsCsv("data/2020-element-specs.csv"),
    ]);

    return csvIndicatorSpecs.map((spec) => {
      const elements: Element[] = csvElements
        .filter(
          (element) =>
            element.indicator === spec.indicator &&
            indexYears.has(element.index) &&
            !["OpCom", "Group"].includes(element.service),
        )
        .map(({element, company: companyId, score, value, kind, service}) => {
          const {category, elementNr, label, description} =
            csvElementSpecs.find((e) => e.element === element) ||
            unreachable(`Element ${element} not found in element specs.`);
          return {
            id: element,
            element,
            elementNr,
            category,
            label,
            description,
            score,
            value,
            kind,
            service,
            companyId,
          };
        });

      const companies = [
        ...elements.reduce(
          (memo, {companyId}) => memo.add(companyId),
          new Set<string>(),
        ),
      ];

      const scores = companies.reduce((memo, company) => {
        const indicator = csvIndicators
          .filter((i) => indexYears.has(i.index))
          .find((i) => i.company === company && i.indicator === spec.indicator);
        return {[company]: indicator ? indicator.score : "NA", ...memo};
      }, {} as Record<string, IndicatorScore>);

      const services = companies.reduce(
        (memo, company) => ({
          [company]: [
            ...elements
              .filter((element) => element.companyId === company)
              .reduce((agg, {service}) => agg.add(service), new Set<string>()),
          ],
          ...memo,
        }),
        {} as Record<string, string[]>,
      );

      const averages = companies.reduce((memo, company) => {
        const companyAverages = (services[company] || []).reduce(
          (agg, service) => {
            const levels = csvLevels.find(
              (l) =>
                l.company === company &&
                l.service === service &&
                l.indicator === spec.indicator &&
                indexYears.has(l.index),
            );
            if (!levels)
              return unreachable(
                `No level found for ${company}/${service}/${spec.indicator}.`,
              );

            return {[service]: levels.score, ...agg};
          },
          {} as Record<string, IndicatorScore>,
        );
        return {[company]: companyAverages, ...memo};
      }, {} as Record<string, Record<string, IndicatorScore>>);

      const sortedElements = companies.reduce((memo, company) => {
        if (!services[company]) return memo;

        return {
          [company]: services[company].reduce(
            (agg, service) => ({
              [service]: elements
                .filter(
                  (element) =>
                    element.companyId === company &&
                    element.service === service,
                )
                .sort((a, b) => {
                  if (a.elementNr < b.elementNr) return -1;
                  if (a.elementNr > b.elementNr) return 1;
                  return 0;
                }),
              ...agg,
            }),
            {} as Record<string, Element[]>,
          ),
          ...memo,
        };
      }, {} as Record<string, Record<string, Element[]>>);

      return {
        id: spec.display,
        indicator: spec.indicator,
        category: spec.category,
        display: spec.display,
        label: spec.label,
        description: spec.description,
        guidance: spec.guidance,
        isParent: spec.isParent,
        hasParent: /[a-z]+$/.test(spec.indicator),
        companies,
        services,
        scores,
        averages,
        elements: sortedElements,
      };
    });
  },
);

/*
 * Load editorial content from Google Docs.
 */
const companyDetails = memoizeAsync<
  (folderId: string) => Promise<CompanyDetails[]>
>(async (folderId) => {
  const auth = getAuth();
  const googleDocs = await listFiles(auth, folderId);
  const companiesDir = path.join(process.cwd(), "content/companies");
  await fsP.mkdir(companiesDir, {recursive: true});

  return Promise.all(
    googleDocs.map(async (googleDoc) => {
      const doc = await fetchDocumentHtml(auth, companiesDir, googleDoc);
      if (!doc.download) return emptyCompany(doc.id);
      const src = await fsP.readFile(doc.download.target, "utf-8");
      const html = processHtml(src);
      return companyDetails2(doc.name, html);
    }),
  );
});

/*
 * Load the company details. This is a dummy right now. It needs to be
 * seen how we can load those. Ideally I fetch them directly from Wordpress.
 */
export const companyData = async (
  companyId: string,
): Promise<[CompanyIndex, CompanyDetails]> => {
  const [indexCache, detailsCache] = await Promise.all([
    companyIndices(),
    companyDetails(companiesFolder),
  ]);
  const index = indexCache.find(({id}) => id === companyId);
  // Until all editorial content is finished we provide an empty company
  // details page.
  const details =
    detailsCache.find(({id}) => id === companyId.toLocaleLowerCase()) ||
    emptyCompany(companyId);

  if (!(index && details)) {
    throw new Error(
      `Couldn't extract company index and details for "${companyId}."`,
    );
  }
  return [index, details];
};

/*
 * Load the indicator details.
 */
export const indicatorData = async (
  indicatorId: string,
): Promise<IndicatorIndex> => {
  const indexCache = await indicatorIndices();
  const index = indexCache.find(({id}) => id === indicatorId);

  if (!index) {
    throw new Error(`Couldn't extract indicator index for "${indicatorId}".`);
  }
  return index;
};
