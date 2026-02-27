import logo from '@/assets/logo-neon.png';

const LoadingScreen = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black overflow-hidden relative">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-black to-black" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with glow effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <img
            src={logo}
            alt="Top Créditos"
            className="h-24 w-24 object-contain relative z-10 animate-float"
            style={{ 
              filter: 'drop-shadow(0 0 20px hsl(263 70% 66% / 0.6)) drop-shadow(0 0 40px hsl(263 70% 66% / 0.3))',
              animation: 'float 3s ease-in-out infinite'
            }}
          />
        </div>

        {/* Spinner */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-white animate-pulse">
            Carregando...
          </p>
          <p className="text-sm text-neutral-400">
            Preparando sua experiência
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
