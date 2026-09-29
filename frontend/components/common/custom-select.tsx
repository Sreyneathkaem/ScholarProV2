import clsx from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  data: { label: string; value: string; className?: string }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  prefix?: string;
  disabled?: boolean;
};

export default function CustomSelect({
  data,
  value,
  onValueChange,
  className,
  placeholder,
  prefix,
  disabled,
}: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={clsx(
          "w-full !h-10 border", // default border
          // error ? 'border-red-500' : 'border-border',
          // 'border-red-500',
          className,
        )}
        disabled={disabled}
      >
        {prefix && <span className="text-sm">{prefix}</span>}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {data.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            className={item.className}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
