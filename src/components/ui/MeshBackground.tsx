export function MeshBackground() {
  return (
    <>
      {/* Light theme — soft pastel mesh gradient */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden dark:hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#eef4ff] to-[#fdf4f8]" />
        <div className="absolute top-[-12%] left-[-8%] w-[52%] h-[52%] rounded-full bg-[#fbcfe8]/45 blur-[110px]" />
        <div className="absolute bottom-[-12%] right-[-8%] w-[48%] h-[48%] rounded-full bg-[#93c5fd]/40 blur-[110px]" />
        <div className="absolute top-[8%] right-[6%] w-[34%] h-[34%] rounded-full bg-[#c4b5fd]/35 blur-[100px]" />
        <div className="absolute bottom-[18%] left-[15%] w-[28%] h-[28%] rounded-full bg-[#fed7aa]/30 blur-[90px]" />
        <div className="absolute top-[45%] left-[40%] w-[22%] h-[22%] rounded-full bg-[#a7f3d0]/20 blur-[80px]" />
      </div>

      {/* Dark theme — deep navy with subtle purple glows */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute inset-0 bg-[#0b0e14]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(88,28,135,0.18)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(67,56,202,0.14)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.6)_0%,transparent_70%)]" />
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-violet-700/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] rounded-full bg-indigo-800/12 blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] rounded-full bg-purple-900/8 blur-[100px]" />
      </div>
    </>
  );
}
