import clsx from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { QUERY_KEY_ENUM } from "@/constants/query-key-enum";
import { apiClient } from "@/api/api";
import type { ApiEndpointProps } from "@/api/endpoint";
import { getDisplayName } from "@/lib/utils/help";

export type SelectApiItem = {
  id: string;
  employeeId?: string;
  firstNameEn?: string;
  lastNameEn?: string;
  employeeIdNumber?: string;
  name?: string;
  labelKey?: string;
};

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  /**
   * Optional key on the API item object to use as the visible label inside the select.
   * If not provided the component falls back to `getDisplayName(item)`.
   */
  labelKey?: string;
  className?: string;
  placeholder?: string;
  apiConfig: {
    queryKey: QUERY_KEY_ENUM;
    pathUrl: ApiEndpointProps;
    dataKey: string;
  };
  onChange?: (selected: SelectApiItem | undefined) => void;
  required?: boolean;
};

export default function CustomSelectApi<T extends FieldValues>({
  className,
  placeholder,
  control,
  name,
  label,
  labelKey,
  apiConfig,
  onChange,
  required = false,
}: Props<T>) {
  const { data, isFetching } = useQuery({
    queryKey: [apiConfig.queryKey],
    queryFn: async (): Promise<{ [key: string]: SelectApiItem[] }> => {
      const url =
        typeof apiConfig.pathUrl === "function"
          ? (apiConfig.pathUrl as (...args: string[]) => string)("", "")
          : typeof apiConfig.pathUrl === "string"
            ? apiConfig.pathUrl
            : "";
      const res = await apiClient.get(url, { params: { limit: 100 } });
      // Return the payload (axios response `.data`) so consumers get the actual data shape
      return res?.data;
    },
  });

  // Normalize to an array. The response payload may be an array directly or an
  // object with a key like `data` or `results` containing the array.
  let array: SelectApiItem[] = [];
  const dataObj = data as unknown;

  if (Array.isArray(dataObj)) {
    array = dataObj as SelectApiItem[];
  } else if (
    dataObj &&
    typeof dataObj === "object" &&
    Array.isArray(
      (dataObj as Record<string, unknown>)[apiConfig.dataKey] as unknown,
    )
  ) {
    array = (dataObj as Record<string, unknown>)[
      apiConfig.dataKey
    ] as SelectApiItem[];
  } else if (
    dataObj &&
    typeof dataObj === "object" &&
    Array.isArray((dataObj as Record<string, unknown>).results as unknown)
  ) {
    array = (dataObj as Record<string, unknown>).results as SelectApiItem[];
  } else {
    array = [];
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {" "}
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          {isFetching ? (
            <div className="p-2 text-left text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                const selectedItem = array.find(
                  (item) => String(item.id) === String(value),
                );
                if (onChange) onChange(selectedItem);
              }}
            >
              <SelectTrigger className={clsx("w-full", className)}>
                <SelectValue placeholder={placeholder}>
                  {field.value &&
                    (() => {
                      const selectedItem = array.find(
                        (item) => String(item.id) === String(field.value),
                      );
                      if (selectedItem) {
                        const itemObj = selectedItem as Record<string, unknown>;
                        return labelKey && itemObj[labelKey]
                          ? String(itemObj[labelKey])
                          : getDisplayName(selectedItem);
                      }
                      return "";
                    })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {array.map((item) => {
                  const itemObj = item as Record<string, unknown>;
                  const display =
                    labelKey && itemObj[labelKey]
                      ? String(itemObj[labelKey])
                      : getDisplayName(item);

                  return (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {display}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
