import { Game } from '@/components/game/game';

export default function Home() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#080b14] p-2 sm:p-3">
      <div className="mx-auto h-full w-full max-w-[440px]">
        <Game />
      </div>
    </main>
  );
}
