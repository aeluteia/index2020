/* eslint no-console: off */
import {promises as fs} from "fs";
import path from "path";
import yargs from "yargs";

import {
  companies,
  companyIndices,
  companyRanking,
  companyServices,
  elements,
  indicatorCompanies,
  indicatorElements,
  indicatorIndices,
  indicators,
  indicatorScores,
} from "../src/csv";
import {companyDetails} from "../src/google";
import generateNav from "../src/navigation";
import {CompanyKind} from "../src/types";

const dataDir = "data";

const writeFile = (target: string): ((d: unknown) => Promise<void>) => async (
  data: unknown,
): Promise<void> => {
  await fs.writeFile(path.join(process.cwd(), target), JSON.stringify(data));
};

(async (): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  yargs
    .scriptName("indexctl")
    .command("data", "generate data structures.", async () => {
      const companiesDir = "data/companies";
      const indicatorsDir = "data/indicators";

      const [
        allCompanies,
        allIndicators,
        allElements,
        scores,
        indicatorIndexScores,
        details,
      ] = await Promise.all([
        companies(),
        indicators(),
        elements(),
        companyIndices(),
        indicatorIndices(),
        companyDetails(),
      ]);

      await fs.mkdir(path.join(process.cwd(), dataDir), {recursive: true});

      const companiesTarget = path.join(dataDir, "companies.json");
      const indicatorsTarget = path.join(dataDir, "indicators.json");
      const elementsTarget = path.join(dataDir, "elements.json");

      await Promise.all([
        writeFile(companiesTarget)(allCompanies),
        writeFile(indicatorsTarget)(allIndicators),
        writeFile(elementsTarget)(allElements),
      ]);

      await Promise.all(
        details.map(async (company) => {
          const companyDir = path.join(companiesDir, company.id);
          await fs.mkdir(path.join(process.cwd(), companyDir), {
            recursive: true,
          });

          const target = path.join(companyDir, "details.json");
          return writeFile(target)(company);
        }),
      );

      // Generate services for every company.
      await Promise.all(
        allCompanies.map(async (company) => {
          const companyDir = path.join(companiesDir, company.id);
          await fs.mkdir(path.join(process.cwd(), companyDir), {
            recursive: true,
          });
          const target = path.join(companyDir, "services.json");
          const validCompanyServices = await companyServices(company.id);
          return writeFile(target)(validCompanyServices);
        }),
      );

      await Promise.all(
        scores.map(async (score) => {
          const companyDir = path.join(companiesDir, score.id);
          await fs.mkdir(path.join(process.cwd(), companyDir), {
            recursive: true,
          });
          const target = path.join(companyDir, "scores.json");
          return writeFile(target)(score);
        }),
      );

      await Promise.all(
        indicatorIndexScores.map(async (indicator) => {
          const indicatorDir = path.join(indicatorsDir, indicator.id);
          await fs.mkdir(path.join(process.cwd(), indicatorDir), {
            recursive: true,
          });
          const target = path.join(indicatorDir, "scores.json");
          return writeFile(target)(indicator);
        }),
      );

      // Generate companies for every indicator.
      await allIndicators.reduce(async (memo, indicator) => {
        await memo;

        // Ensure indicators directory.
        const indicatorDir = path.join(indicatorsDir, indicator.name);
        await fs.mkdir(path.join(process.cwd(), indicatorDir), {
          recursive: true,
        });
        const indicatorCompaniesTarget = path.join(
          indicatorDir,
          "companies.json",
        );
        const indicatorScoresTarget = path.join(
          indicatorDir,
          "company-scores.json",
        );
        const indicatorElementsTarget = path.join(
          indicatorDir,
          "elements.json",
        );

        await indicatorCompanies(indicator.id).then(
          writeFile(indicatorCompaniesTarget),
        );
        await indicatorScores(indicator.id).then(
          writeFile(indicatorScoresTarget),
        );
        await indicatorElements(indicator.id).then(
          writeFile(indicatorElementsTarget),
        );
      }, Promise.resolve());

      await Promise.all(
        (["telecom", "internet"] as CompanyKind[]).map(
          async (kind: CompanyKind) => {
            const target = path.join(dataDir, `ranking-${kind}.json`);
            const ranking = await companyRanking(kind);
            return writeFile(target)(ranking);
          },
        ),
      );
    })
    .command("fixtures", "generate test fixtures.", async () => {
      const fixturesDir = "fixtures";
      await fs.mkdir(path.join(process.cwd(), fixturesDir), {recursive: true});

      const [scores, indicatorIndexScores] = await Promise.all([
        companyIndices(),
        indicatorIndices(),
      ]);

      const scoresTarget = path.join(fixturesDir, "scores.json");
      const indicatorsTarget = path.join(fixturesDir, "indicators.json");

      await Promise.all([
        writeFile(scoresTarget)(scores),
        writeFile(indicatorsTarget)(indicatorIndexScores),
      ]);
    })
    .command("navigation", "generate navigation structure.", async () => {
      const data = await generateNav();
      const outTarget = path.join(dataDir, "navigation.json");
      await writeFile(outTarget)(data);
    })
    .demandCommand(1)
    .help()
    .alias("help", "h")
    .hide("version").argv;
})();
