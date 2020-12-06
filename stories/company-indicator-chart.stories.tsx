import {Story} from "@storybook/react/types-6-0";
import React from "react";

import CompanyIndicatorChart from "../src/components/company-indicator-chart";
import {Indicator, IndicatorCategory} from "../src/types";
import fixtures from "./scores-fixtures.json";

interface CompanyIndicatorChartStoryProps {
  company: string;
  category: IndicatorCategory;
}

export default {
  title: "CompanyIndicatorChart",
  component: CompanyIndicatorChart,
  argTypes: {
    company: {
      control: {
        type: "select",
        options: fixtures.map(({company}) => company),
      },
    },
    category: {
      control: {
        type: "inline-radio",
        options: ["governance", "freedom", "privacy"],
      },
    },
  },
};

const Template: Story<CompanyIndicatorChartStoryProps> = ({
  category,
  company,
}) => {
  const selectedCompany = fixtures.find(
    (fixture) => fixture.company === company,
  );

  console.log(selectedCompany);

  if (!selectedCompany) throw new Error(`${company} not found in fixtures.`);

  const indicators: Indicator[] = selectedCompany.indicators[
    category
  ] as Indicator[];

  return <CompanyIndicatorChart indicators={indicators} />;
};

export const Chart = Template.bind({});
Chart.args = {
  category: "governance",
  company: "Ooredoo",
};
