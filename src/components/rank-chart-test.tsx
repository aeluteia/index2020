import c from "clsx";
import Link from "next/link";
import React, {useState} from "react";

import {useChartResize} from "../hooks";
import {CompanyKind, CompanyRank, IndicatorCategoryExt} from "../types";
import PercentageBar from "./percentage-bar";

interface RankChartProps {
  ranking: CompanyRank[];
  className?: string;
  activeCompany?: string;
  category?: IndicatorCategoryExt;
  chartHeight?: number;
  hasHeader?: boolean;
  isPrint?: boolean;
}

const RankChart = ({
  ranking,
  className,
  activeCompany,
  category = "total",
  chartHeight = 10,
  hasHeader = true,
  isPrint = false,
}: RankChartProps) => {
  const [chartRef, chartWidth] = useChartResize();

  const [highlightedCompany, setHighlightedCompany] = useState<string | undefined
  >();

  const categoryClassName = {
    "text-cat-governance": category === "governance",
    "text-cat-freedom": category === "freedom",
    "text-cat-privacy": category === "privacy",
    "text-prissian": category === "total",
  };

  const companyKind: CompanyKind = "internet";
  const companyWidth = "w-24"

  const chartRow = (
    {id, companyPretty, score, rank}: CompanyRank,
    idx: number,
  ) => {
    // eslint-disable-next-line unicorn/no-null
    const ref = idx === 0 ? chartRef : null;
    const isActiveCompany = id === activeCompany;
    const isHighlightedCompany = id === highlightedCompany;

    const highlightedClassName = {
      "text-prissian": isActiveCompany || isHighlightedCompany,
    };

    const rankClassName = {
      "bg-prissian": isHighlightedCompany,
      "bg-diff-del": !isHighlightedCompany
    };

    const barClassName =
      isActiveCompany || isHighlightedCompany
        ? "text-prissian"
        : categoryClassName;

    const companyLabel = isPrint ? (
      <span
        className={c(
          "flex-none font-circular select-none whitespace-nowrap",
          highlightedClassName,
          companyWidth,
        )}
      >
        {companyPretty}
      </span>
    ) : (
      <Link passHref href={`/companies/${id}`}>
        <a
          className={c(
            "flex-none font-circular text-black font-normal select-none whitespace-nowrap",
            highlightedClassName,
            companyWidth,
          )}
        >
          {companyPretty}
        </a>
      </Link>
    );

    return (
      <div
        key={`home-rank-${category}-${id}`}
        className={c(
          "flex items-center font-circular text-sm mb-1",
          highlightedClassName,
        )}
        onMouseEnter={() => setHighlightedCompany(id)}
        onMouseLeave={() => setHighlightedCompany(undefined)}
      >
        {companyLabel}

        <div className="flex-none w-8 flex justify-center">
          <div
            className={c(
              "rounded-full h-5 w-5 text-white flex items-center justify-center",
              rankClassName,
            )}
          >
            {rank}
          </div>
        </div>

        <div ref={ref} className="flex-grow ml-2">
          <svg
            version="1"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height={chartHeight}
            transform="translate(0, 0)"
            aria-label={`Score bar for ${companyPretty}: ${score}`}
          >
            <PercentageBar
              value={score}
              width={chartWidth}
              height={chartHeight}
              className={barClassName}
            />
          </svg>
        </div>
          <span className="pl-1 pr-1 select-none float-right">{score}%</span>
        </div>
    );
  };

  return (
    <div className={c("flex flex-col", className)}>
      {hasHeader && (
        <>
          <div className="flex items-center font-circular text-sm mb-2 mt-3">
            <div className={c("flex-none", companyWidth)}>&nbsp;</div>
          </div>
        </>
      )}

      {ranking.map((company, idx) => chartRow(company, idx))}
    </div>
  );
};

export default RankChart;
