'use client'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
'use client'


export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex">
            {/* Left side - Auth Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    {children}
                </div>
            </div>

            {/* Right side - Image/Info */}
            <div className="hidden lg:block relative w-0 flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700">
                    <div className="absolute inset-0 bg-black opacity-20" />
                    <div className="absolute inset-0 flex flex-col justify-center px-12 text-white">
                        <h2 className="text-4xl font-bold mb-6">
                            AI-Powered Recruitment Platform
                        </h2>
                        <p className="text-xl text-gray-100 mb-8">
                            Streamline your hiring process with our intelligent recruitment platform.
                            Find the perfect candidates faster and more efficiently.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-lg">AI-powered candidate matching</p>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-lg">Automated interview scheduling</p>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-lg">Smart candidate analytics</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 