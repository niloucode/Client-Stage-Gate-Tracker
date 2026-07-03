'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { PasswordInput } from '@/features/auth/ui/PasswordInput'

type Fields = {
  // TODO: confirm these map to User.firstName and User.lastName on the backend
  // (per Byron's data model: User → Client → Contract)
  firstName: string
  lastName: string
  companyName: string
  email: string
  password: string
  confirmPassword: string
  streetNumber: string
  streetName: string
  city: string
  country: string
  tin: string
  phone: string
}

type Errors = Partial<Record<keyof Fields, string>>

export function ClientSignupForm() {
  const router = useRouter()

  const [fields, setFields] = useState<Fields>({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    streetNumber: '',
    streetName: '',
    city: '',
    country: '',
    tin: '',
    phone: '',
  })

  const [errors, setErrors] = useState<Errors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }))
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function setNumeric(key: keyof Fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '')
      setFields((prev) => ({ ...prev, [key]: digits }))
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function validate(): Errors {
    const e: Errors = {}
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)

    if (!fields.firstName.trim()) e.firstName = 'First name is required.'
    if (!fields.lastName.trim()) e.lastName = 'Last name is required.'
    if (!fields.companyName.trim()) e.companyName = 'Company name is required.'
    if (!fields.email) e.email = 'Email address is required.'
    else if (!emailOk) e.email = 'Enter a valid email address.'
    if (!fields.password) e.password = 'Password is required.'
    if (!fields.confirmPassword) e.confirmPassword = 'Please confirm your password.'
    else if (fields.password && fields.password !== fields.confirmPassword)
      e.confirmPassword = 'Passwords do not match.'
    if (!fields.streetNumber.trim()) e.streetNumber = 'Required.'
    if (!fields.streetName.trim()) e.streetName = 'Street name is required.'
    if (!fields.city.trim()) e.city = 'City is required.'
    if (!fields.country.trim()) e.country = 'Country is required.'
    if (!fields.tin) e.tin = 'TIN is required.'
    if (!fields.phone) e.phone = 'Phone number is required.'

    return e
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault()
    setApiError(null)
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      // TODO: connect to backend
      // Available fields:
      //   fields.firstName, fields.lastName, fields.companyName, fields.email, fields.password
      //   fields.streetNumber, fields.streetName, fields.city, fields.country
      //   fields.tin, fields.phone
      //
      // On API error: call setApiError('Your error message here') and return
      router.push('/login')
    } catch {
      setApiError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function errClass(key: keyof Fields) {
    return errors[key] ? 'border-red-400 focus:ring-red-400' : ''
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* First Name + Last Name */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <Label htmlFor="firstName" className="mb-1.5">First Name</Label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Jane"
            value={fields.firstName}
            onChange={set('firstName')}
            className={errClass('firstName')}
          />
          {errors.firstName && (
            <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Label htmlFor="lastName" className="mb-1.5">Last Name</Label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Smith"
            value={fields.lastName}
            onChange={set('lastName')}
            className={errClass('lastName')}
          />
          {errors.lastName && (
            <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Company Name */}
      <div>
        <Label htmlFor="companyName" className="mb-1.5">Company Name</Label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          placeholder="Acme Corporation"
          value={fields.companyName}
          onChange={set('companyName')}
          className={errClass('companyName')}
        />
        {errors.companyName && (
          <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email" className="mb-1.5">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={fields.email}
          onChange={set('email')}
          className={errClass('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <Label htmlFor="password" className="mb-1.5">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="Create a password"
          value={fields.password}
          onChange={set('password')}
          className={errClass('password')}
        />
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <Label htmlFor="confirmPassword" className="mb-1.5">Confirm Password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirm your password"
          value={fields.confirmPassword}
          onChange={set('confirmPassword')}
          className={errClass('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Address */}
      <div className="pt-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Address
        </p>

        {/* Street Number + Street Name */}
        <div className="flex gap-3 mb-3">
          <div className="w-[30%] shrink-0">
            <Label htmlFor="streetNumber" className="mb-1.5">Street No.</Label>
            <Input
              id="streetNumber"
              name="streetNumber"
              type="text"
              placeholder="123"
              value={fields.streetNumber}
              onChange={set('streetNumber')}
              className={errClass('streetNumber')}
            />
            {errors.streetNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.streetNumber}</p>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="streetName" className="mb-1.5">Street Name</Label>
            <Input
              id="streetName"
              name="streetName"
              type="text"
              placeholder="Main Street"
              value={fields.streetName}
              onChange={set('streetName')}
              className={errClass('streetName')}
            />
            {errors.streetName && (
              <p className="text-xs text-red-500 mt-1">{errors.streetName}</p>
            )}
          </div>
        </div>

        {/* City + Country */}
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <Label htmlFor="city" className="mb-1.5">City</Label>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="New York"
              value={fields.city}
              onChange={set('city')}
              className={errClass('city')}
            />
            {errors.city && (
              <p className="text-xs text-red-500 mt-1">{errors.city}</p>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Label htmlFor="country" className="mb-1.5">Country</Label>
            <Input
              id="country"
              name="country"
              type="text"
              placeholder="United States"
              value={fields.country}
              onChange={set('country')}
              className={errClass('country')}
            />
            {errors.country && (
              <p className="text-xs text-red-500 mt-1">{errors.country}</p>
            )}
          </div>
        </div>
      </div>

      {/* TIN */}
      <div>
        <Label htmlFor="tin" className="mb-1.5">TIN (Tax Identification Number)</Label>
        <Input
          id="tin"
          name="tin"
          type="text"
          inputMode="numeric"
          placeholder="000000000"
          value={fields.tin}
          onChange={setNumeric('tin')}
          className={errClass('tin')}
        />
        {errors.tin && (
          <p className="text-xs text-red-500 mt-1">{errors.tin}</p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phone" className="mb-1.5">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="text"
          inputMode="numeric"
          placeholder="12025550100"
          value={fields.phone}
          onChange={setNumeric('phone')}
          className={errClass('phone')}
        />
        {errors.phone && (
          <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
        )}
      </div>

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {apiError}
        </p>
      )}

      <Button type="submit" className="mt-2" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </Button>

      {/* OR divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-[#F8F9FB] px-3 text-gray-400">OR</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Sign in
        </Link>
      </p>

    </form>
  )
}
