export default function StorySkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
        </div>
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  )
}


