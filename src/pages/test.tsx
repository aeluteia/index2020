import React, { useState } from "react";

import CategorySelector from "../components/category-selector";
import Selector from "../components/selector-test";
import Layout from "../components/layout";
import RankChart from "../components/rank-chart-test";
import { companyRankingData } from "../data";
import { CompanyRank, CompanySelectOption, IndicatorCategoryExt } from "../types";
import { Option, SingleValue } from "../components/service-selector";


interface TestProps {
  // First element are telecom rankings, second are platform rankings.
  totalRanking: [CompanyRank[]];
  // First element are telecom rankings, second are platform rankings.
  governanceRanking: [CompanyRank[]];
  // First element are telecom rankings, second are platform rankings.
  freedomRanking: [CompanyRank[]];
  // First element are telecom rankings, second are platform rankings.
  privacyRanking: [CompanyRank[]];
}

export const getStaticProps = async () => {
  const [
    totalRanking,
    governanceRanking,
    freedomRanking,
    privacyRanking,
  ] = await Promise.all(
    ([
      "total",
      "governance",
      "freedom",
      "privacy",
    ] as IndicatorCategoryExt[]).map(async (category) => {
      return [
        await companyRankingData("internet", category),
      ];
    }),
  );

  return {
    props: {
      totalRanking,
      governanceRanking,
      freedomRanking,
      privacyRanking,
    },
  };
};

const Test = ({
  totalRanking,
  governanceRanking,
  freedomRanking,
  privacyRanking,
}: TestProps) => {
  const [selectedCategory, setSelectedCategory] = useState<IndicatorCategoryExt>("total");
  const [platformRankings, setPlatformRankings] = useState<CompanyRank[]>(totalRanking[0]);

  const handleSelectCategory = (category: IndicatorCategoryExt): void => {
    switch (category) {
      case "total": {
        setSelectedCategory("total");
        setPlatformRankings(totalRanking[0]);
        break;
      }
      case "governance": {
        setSelectedCategory("governance");
        setPlatformRankings(governanceRanking[0]);
        break;
      }
      case "freedom": {
        setSelectedCategory("freedom");
        setPlatformRankings(freedomRanking[0]);
        break;
      }
      case "privacy": {
        setSelectedCategory("privacy");
        setPlatformRankings(privacyRanking[0]);
        break;
      }
      default: {
        break;
      }
    }
  };

  return (
    <Layout hideScrollArrow>
      <div className="relative">
        <div className="absolute flex flex-row w-full h-full top-0">
          <div className="lg:w-1/2 w-full lg:bg-accent-red" />
          <div className="lg:w-1/2 w-full lg:bg-light-freedom" />
        </div>
      </div>
      <div className="lg:container lg:mx-auto flex flex-col lg:flex-row lg:justify-between my-10">
        <div className="flex flex-col sm:flex-row lg:w-2/3 px-6">
          <div className="flex flex-col w-full">
            <CategorySelector
              selected={selectedCategory}
              onClick={handleSelectCategory}
            />
            <div>
              <Selector<CompanySelectOption>
                id="company-selector"
                title=""
                isClearable
                defaultValue="Select company..."
                LocalSingleValue={SingleValue}
                className="w-full sm:w-1/2 mr-3"
              />
            </div>
            <RankChart
              className="w-full sm:w-1/2 mr-3"
              ranking={platformRankings}
              category={selectedCategory}
              hasHeader
            />
          </div>
        </div>
      </div>

    </Layout>
  );
};

export default Test;
