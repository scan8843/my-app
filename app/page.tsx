export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-black px-6">
      <h1 className="text-5xl font-bold text-blue-600 dark:text-blue-400">
        안녕하세요, 경헌입니다
      </h1>

      <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 text-center">
        Next.js로 만드는 나만의 개인 홈페이지예요.
      </p>

      <div className="mt-10 flex gap-6 text-lg">
        <a
          href="https://github.com/scan8843"
          className="text-blue-500 hover:underline"
        >
          GitHub
        </a>
        <a
          href="#"
          className="text-pink-500 hover:underline"
        >
          Instagram
        </a>
        <a
          href="#"
          className="text-green-600 hover:underline"
        >
          Blog
        </a>
      </div>
    </main>
  );
}
