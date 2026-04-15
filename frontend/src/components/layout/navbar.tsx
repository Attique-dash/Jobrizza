'use client'

import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'For Companies', href: '/company' },
    { name: 'For Candidates', href: '/candidate' },
    { name: 'Pricing', href: '/pricing' },
]

export function Navbar() {
    return (
        <Disclosure as="nav" className="bg-white shadow">
            {({ open }) => (
                <>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex flex-shrink-0 items-center">
                                    <Link href="/" className="flex items-center gap-3 group">
                                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-md ring-1 ring-gray-200/50 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                            <Image 
                                                src="/images/logo.png" 
                                                alt="Jobrizza logo" 
                                                width={56} 
                                                height={56} 
                                                className="h-full w-full object-contain object-center" 
                                                priority 
                                            />
                                        </div>
                                        <span className="text-xl sm:text-2xl font-bold text-blue-600 hidden sm:block">
                                            Jobrizza
                                        </span>
                                    </Link>
                                </div>
                                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:items-center">
                                <Link
                                    href="/auth/login"
                                    className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                                >
                                    Sign up
                                </Link>
                            </div>
                            <div className="-mr-2 flex items-center sm:hidden">
                                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500">
                                    <span className="sr-only">Open main menu</span>
                                    {open ? (
                                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                                    ) : (
                                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                                    )}
                                </Disclosure.Button>
                            </div>
                        </div>
                    </div>

                    <Disclosure.Panel className="sm:hidden">
                        <div className="space-y-1 pb-3 pt-2">
                            {navigation.map((item) => (
                                <Disclosure.Button
                                    key={item.name}
                                    as={Link}
                                    href={item.href}
                                    className="block py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    {item.name}
                                </Disclosure.Button>
                            ))}
                        </div>
                        <div className="border-t border-gray-200 pb-3 pt-4">
                            <div className="space-y-1">
                                <Disclosure.Button
                                    as={Link}
                                    href="/auth/login"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                >
                                    Sign in
                                </Disclosure.Button>
                                <Disclosure.Button
                                    as={Link}
                                    href="/auth/signup"
                                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                >
                                    Sign up
                                </Disclosure.Button>
                            </div>
                        </div>
                    </Disclosure.Panel>
                </>
            )}
        </Disclosure>
    )
} 