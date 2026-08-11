"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { parsePhoneNumberWithError, isValidPhoneNumber, getCountries, getCountryCallingCode } from "libphonenumber-js"
import type { CountryCode } from "libphonenumber-js"

const COUNTRIES = getCountries().map((code) => ({
	code: code as CountryCode,
	callingCode: `+${getCountryCallingCode(code as CountryCode)}`,
})).sort((a, b) => a.callingCode.localeCompare(b.callingCode))

interface PhoneInputProps {
	value?: string
	onChange?: (value: string) => void
	error?: string
	placeholder?: string
	className?: string
}

export function PhoneInput({
	value = "",
	onChange,
	error,
	placeholder = "Phone number",
	className,
}: PhoneInputProps) {
	const [country, setCountry] = useState<CountryCode>("US")

	const validation = useMemo(() => {
		if (!value) return null
		try {
			const phoneNumber = parsePhoneNumberWithError(value, country)
			if (phoneNumber && isValidPhoneNumber(value, country)) {
				return { valid: true, formatted: phoneNumber.formatInternational() }
			}
			return { valid: false, formatted: null }
		} catch {
			return { valid: false, formatted: null }
		}
	}, [value, country])

	const handleCountryChange = (value: string | null) => {
		if (value) setCountry(value as CountryCode)
	}

	return (
		<div className={className}>
			<div className="flex gap-2">
				<Select value={country} onValueChange={handleCountryChange}>
					<SelectTrigger className="w-[130px] shrink-0">
						<SelectValue>
							{COUNTRIES.find((c) => c.code === country)?.callingCode || `+1`}
						</SelectValue>
					</SelectTrigger>
					<SelectContent className="max-h-[250px]">
						{COUNTRIES.map((c) => (
							<SelectItem key={c.code} value={c.code}>
								{c.callingCode} — {c.code}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Input
					type="tel"
					value={value}
					onChange={(e) => onChange?.(e.target.value)}
					placeholder={placeholder}
					className={error || (value && validation?.valid === false) ? "border-destructive" : ""}
				/>
			</div>
			{validation?.valid && validation.formatted && (
				<p className="text-xs text-green-600 mt-1">{validation.formatted}</p>
			)}
			{error && (
				<p className="text-xs text-destructive mt-1">{error}</p>
			)}
		</div>
	)
}
