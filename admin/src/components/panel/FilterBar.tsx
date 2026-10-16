"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MdSearch } from "react-icons/md";

type FilterBarProps = {
  /** The page the bar sits on, e.g. "/logs". */
  path: string;
  /** Everything in the address the page understands, filters and period alike. */
  params: Record<string, string | undefined>;
  search?: { name: string; placeholder: string };
  selects?: {
    name: string;
    label: string;
    options: { value: string; title: string }[];
  }[];
};

/**
 * The search box and selects above a list. The address bar is the source of
 * truth: the fields mirror it, and every change navigates — back to the top
 * of the list, since a new filter makes the old place in it meaningless.
 */
export function FilterBar({ path, params, search, selects }: FilterBarProps) {
  const router = useRouter();

  const current = search ? (params[search.name] ?? "") : "";
  const [seen, setSeen] = useState(current);
  const [text, setText] = useState(current);
  if (seen !== current) {
    setSeen(current);
    setText(current);
  }

  const apply = (change: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const [name, value] of Object.entries({
      ...params,
      ...change,
      before: undefined,
    })) {
      if (value) query.set(name, value);
    }
    const tail = query.toString();
    router.push(tail ? `${path}?${tail}` : path);
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (search) apply({ [search.name]: text.trim() });
      }}
      className="card flex flex-wrap gap-3 p-6 lg:flex-nowrap lg:gap-5"
    >
      {search && (
        <label className="relative min-w-0 flex-[1_1_100%] lg:flex-[1.4_1_0]">
          <MdSearch
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-nav"
          />
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            className="filter pl-11"
          />
        </label>
      )}
      {selects?.map((select) => (
        <select
          key={select.name}
          value={params[select.name] ?? ""}
          onChange={(event) => apply({ [select.name]: event.target.value })}
          aria-label={select.label}
          className="filter flex-[1_1_100%] sm:flex-[1_1_0] lg:flex-[0_0_15rem]"
        >
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.title}
            </option>
          ))}
        </select>
      ))}
    </form>
  );
}
