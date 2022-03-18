/* eslint react/jsx-props-no-spreading: off */
import c from "clsx";
import React from "react";
import Select, {
  components,
  ControlProps,
  GroupProps,
  InputProps,
  OptionProps,
  PlaceholderProps,
  SingleValueProps,
  ValueType,
} from "react-select";

import { SelectOption } from "../types";

export const Input = (props: InputProps) => {
  return <components.Input {...props} className="text-sm" />;
};

export const LargeInput = (props: InputProps) => {
  return (
    <components.Input
      {...props}
      className="text-lg leading-none text-prissian"
    />
  );
};

export const SingleValue = <T extends SelectOption>(
  props: SingleValueProps<T>,
) => {
  return <components.SingleValue {...props} className="text-sm" />;
};

export const LargeSingleValue = <T extends SelectOption>({
  children,
  innerProps,
}: SingleValueProps<T>) => {
  return (
    <div className="text-lg flex-1 leading-none" {...innerProps}>
      {children}
    </div>
  );
};

export const IndicatorSeparator = () => {
  return <span />;
};

export const Control = <T extends SelectOption, K extends boolean>({
  children,
  innerRef,
  innerProps,
}: ControlProps<T, K>) => {
  return (
    <div
      className="border-b-2 border-prissian flex flex-row justify-between items-start w-full"
      ref={innerRef}
      {...innerProps}
    >
      {children}
    </div>
  );
};

export const Group = <T extends SelectOption, K extends boolean>({
  Heading,
  children,
  isMulti,
  ...props
}: GroupProps<T, K>) => {
  const className = {
    "flex flex-wrap": isMulti,
  };

  return (
    <div className="p-2 bg-white">
      <Heading {...props} />
      <div className={c("bg-white mt-1", className)}>{children}</div>
    </div>
  );
};

export const Placeholder = <T extends SelectOption, K extends boolean>({
  children,
  innerProps,
}: PlaceholderProps<T, K>) => {
  return (
    <div className="text-sm text-black" {...innerProps}>
      {children}
    </div>
  );
};

export const Option = <T extends SelectOption, K extends boolean>({
  isSelected,
  isFocused,
  innerRef,
  innerProps,
  data,
}: OptionProps<T, K>) => {
  const className = c("text-sm pl-2 pr-2 p-1", {
    "bg-prissian text-white": isSelected,
    "bg-beige text-prissian": isFocused && !isSelected,
    "cursor-pointer": !isSelected,
    "bg-white text-prissian": !isFocused && !isSelected,
  });

  return (
    <div className={className} ref={innerRef} {...innerProps}>
      {data.label}
    </div>
  );
};

interface SelectorProps<T extends SelectOption> {
  id: string;
  title: string;
  options: T[];
  onSelect: (value?: T) => void;
  defaultValue?: T;
  isSearchable?: boolean;
  isClearable?: boolean;
  LocalOption?: (props: OptionProps<T, false>) => JSX.Element;
  LocalSingleValue?: (props: SingleValueProps<T>) => JSX.Element;
  className?: string;
}

const Selector = <T extends SelectOption>({
  id,
  title,
  options,
  onSelect,
  defaultValue,
  isSearchable = false,
  isClearable = false,
  LocalOption = Option,
  LocalSingleValue = SingleValue,
  className,
}: SelectorProps<T>) => {
  const handleChange = (value: ValueType<T, false>) => {
    onSelect(value || undefined);
  };

  return (
    <div className={c("flex flex-col justify-between h-16", className)}>
      <span className="text-sm font-circular">{title}</span>
      <Select
        instanceId={id}
        options={options}
        className="font-circular text-sm"
        defaultValue={defaultValue}
        openMenuOnFocus
        isSearchable={isSearchable}
        isClearable={isClearable}
        components={{
          Input,
          IndicatorSeparator,
          Placeholder,
          Control,
          SingleValue: LocalSingleValue,
          Option: LocalOption,
        }}
        onChange={handleChange}
      />
    </div>
  );
};

export default Selector;
