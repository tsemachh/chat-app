import { Sparkles } from "lucide-react";

const SidePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-base-200 to-base-100 p-12">
      <div className="max-w-md text-center">
        {/* Floating animated sparkles */}
        <div className="relative flex justify-center items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-primary/20 animate-spin-slow blur-sm" />
          <div className="absolute">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-extrabold mb-3">{title}</h2>

        {/* Subtitle */}
        <p className="text-base-content/70">{subtitle}</p>
      </div>
    </div>
  );
};

export default SidePattern;