import c from "clsx";
import React, {useState} from "react";

import ChevronDown from "../images/icons/chevron-down.svg";
import ChevronRight from "../images/icons/chevron-right.svg";

interface ExpandableDescriptionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const ExpandableDescription = ({
  label,
  children,
  className,
}: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={c("flex flex-col font-circular text-sm", className)}>
      <button className="flex items-center" onClick={toggleExpanded}>
        <span className="text-prissian font-circular text-sm">{label}</span>

        {isExpanded ? (
          <ChevronDown className="ml-2 text-prissian stroke-current" />
        ) : (
          <ChevronRight className="ml-2 text-prissian stroke-current" />
        )}
      </button>

      {isExpanded && children}
    </div>
  );
};

export default ExpandableDescription;
