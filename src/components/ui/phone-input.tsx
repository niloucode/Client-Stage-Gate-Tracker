"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ComponentProps } from "react";
import * as BasePhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxSeparator,
	ComboboxTrigger,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown, GlobeIcon } from "lucide-react";

type PhoneInputSize = "sm" | "default" | "lg";

const PhoneInputContext = createContext<{
	variant: PhoneInputSize;
	popupClassName?: string;
	scrollAreaClassName?: string;
}>({
	variant: "default",
	popupClassName: undefined,
	scrollAreaClassName: undefined,
});

type PhoneInputProps = Omit<
	ComponentProps<"input">,
	"onChange" | "value" | "ref"
> &
	Omit<
		BasePhoneInput.Props<typeof BasePhoneInput.default>,
		"onChange" | "variant" | "popupClassName" | "scrollAreaClassName"
	> & {
		label?: string;
		required?: boolean;
		error?: string | boolean;
		containerClassName?: string;
		onChange?: (value: BasePhoneInput.Value) => void;
		variant?: PhoneInputSize;
		popupClassName?: string;
		scrollAreaClassName?: string;
	};

function PhoneInput({
	label,
	required,
	error = false,
	containerClassName,
	className,
	variant = "default",
	popupClassName,
	scrollAreaClassName,
	onChange,
	value,
	defaultCountry = "US",
	...props
}: PhoneInputProps) {
	const errorMessage = typeof error === "string" ? error : undefined;
	const isError =
		!!error || props["aria-invalid"] === true || props["aria-invalid"] === "true";

	const content = (
		<PhoneInputContext.Provider
			value={{ variant, popupClassName, scrollAreaClassName }}
		>
			<BasePhoneInput.default
				aria-invalid={isError ? true : undefined}
				className={cn(
					"flex rounded-sm transition-all [&_button]:border-gray-300 [&_input]:border-gray-300 [&_button]:bg-neutral-surface [&_input]:bg-neutral-surface",
					isError &&
						"[&_button]:border-destructive [&_input]:border-destructive ring-3 ring-destructive/20 rounded-sm",
					className,
				)}
				flagComponent={FlagComponent}
				countrySelectComponent={CountrySelect}
				inputComponent={InputComponent}
				smartCaret={false}
				limitMaxLength={true}
				defaultCountry={defaultCountry}
				value={value || undefined}
				onChange={(val) => onChange?.(val || ("" as BasePhoneInput.Value))}
				{...props}
			/>
		</PhoneInputContext.Provider>
	);

	if (!label) {
		return content;
	}

	return (
		<div className={cn("flex flex-col gap-1 w-full", containerClassName)}>
			<div className="flex items-center justify-between">
				<Label required={required} error={isError}>
					{label}
				</Label>
				{errorMessage && (
					<span className="text-xs font-normal text-destructive">
						{errorMessage}
					</span>
				)}
			</div>
			{content}
		</div>
	);
}

function InputComponent({ className, ...props }: ComponentProps<typeof Input>) {
	const { variant } = useContext(PhoneInputContext);

	return (
		<Input
			className={cn(
				"ring-0! focus:ring-0! focus-visible:ring-0 focus-visible:ring-offset-0", // Add these
				"rounded-s-none rounded-e-sm outline-none! focus:z-1",
				variant === "sm" && "h-7 text-xs",
				variant === "lg" && "h-9 text-base",
				className,
			)}
			{...props}
		/>
	);
}

type CountryEntry = {
	label: string;
	value: BasePhoneInput.Country | undefined;
};

type CountrySelectProps = {
	disabled?: boolean;
	value: BasePhoneInput.Country;
	options: CountryEntry[];
	onChange: (country: BasePhoneInput.Country) => void;
};

function CountrySelect({
	disabled,
	value: selectedCountry,
	options: countryList,
	onChange,
}: CountrySelectProps) {
	const { variant, popupClassName } = useContext(PhoneInputContext);
	const [searchValue, setSearchValue] = useState("");

	const filteredCountries = useMemo(() => {
		if (!searchValue) return countryList;
		const search = searchValue.toLowerCase().trim().replace(/^\+/, "");

		return countryList.filter(({ label, value }) => {
			if (!value) return false;
			const callingCode = BasePhoneInput.getCountryCallingCode(value);
			return (
				label.toLowerCase().includes(search) ||
				value.toLowerCase().includes(search) ||
				callingCode.includes(search)
			);
		});
	}, [countryList, searchValue]);

	const callingCode = selectedCountry
		? BasePhoneInput.getCountryCallingCode(selectedCountry)
		: null;

	return (
		<Combobox
			items={filteredCountries}
			value={selectedCountry || ""}
			onValueChange={(country: BasePhoneInput.Country | null) => {
				if (country) {
					onChange(country);
				}
			}}
		>
			<ComboboxTrigger
				render={
					<Button
						variant="secondary"
						size={variant}
						type="button"
						className={cn(
							"rounded-s-sm rounded-e-none flex items-center gap-1.5 border-e-0 px-2.5 py-5 leading-none focus:z-10 data-pressed:bg-transparent shrink-0",
							disabled && "opacity-50",
						)}
						disabled={disabled}
					>
						<FlagComponent
							country={selectedCountry}
							countryName={selectedCountry}
						/>
						{callingCode && (
							<span className="text-xs font-medium text-muted-foreground">
								+{callingCode}
							</span>
						)}
						<ChevronsUpDown className="size-3 text-muted-foreground/60 shrink-0" />
					</Button>
				}
			/>
			<ComboboxContent
				className={cn(
					"w-xs *:data-[slot=input-group]:bg-transparent",
					popupClassName,
				)}
			>
				<ComboboxInput
					placeholder="Search country or code (e.g. +63, US)"
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					showTrigger={false}
					className="border-input focus-visible:border-border rounded-none border-0 px-3 py-2.5 text-xs shadow-none ring-0! outline-none! focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
				<ComboboxSeparator />
				<ComboboxEmpty className="px-4 py-2.5 text-sm">
					No country or code found.
				</ComboboxEmpty>
				<ComboboxList>
					<div className="relative flex max-h-full">
						<div className="flex max-h-[min(var(--available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain">
							<ScrollArea className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 **:data-[slot=scroll-area-viewport]:h-full **:data-[slot=scroll-area-viewport]:overscroll-contain">
								{filteredCountries.map((item: CountryEntry) =>
									item.value ? (
										<ComboboxItem
											key={item.value}
											value={item.value}
											className="flex items-center gap-2"
										>
											<FlagComponent
												country={item.value}
												countryName={item.label}
											/>
											<span className="flex-1 text-sm">{item.label}</span>
											<span className="text-foreground/50 text-sm font-mono">
												{`+${BasePhoneInput.getCountryCallingCode(item.value)}`}
											</span>
										</ComboboxItem>
									) : null,
								)}
							</ScrollArea>
						</div>
					</div>
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

function FlagComponent({ country, countryName }: BasePhoneInput.FlagProps) {
	const Flag = flags[country];

	return (
		<span className="flex h-4 w-4 items-center justify-center shrink-0 [&_svg:not([class*='size-'])]:size-full! [&_svg:not([class*='size-'])]:rounded-[5px]">
			{Flag ? (
				<Flag title={countryName} />
			) : (
				<GlobeIcon className="size-4 opacity-60" />
			)}
		</span>
	);
}

export { PhoneInput };