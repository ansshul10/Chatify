import { motion } from "framer-motion";
import { Link }   from "react-router-dom";

const IconMsg = () => (
  <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center
                    px-4 py-20 relative overflow-hidden">

      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-600/20
                      rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-600/20
                      rounded-full blur-[100px] pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(14,165,233,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(14,165,233,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600
                       flex items-center justify-center shadow-2xl mb-4"
            whileHover={{ rotate: 10, scale: 1.05 }}
          >
            <IconMsg />
          </motion.div>
          <Link to="/" className="font-bold text-2xl bg-gradient-to-r from-primary-400
                                   via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Chatify
          </Link>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-3xl shadow-2xl">
          {/* Title */}
          {title && (
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-sm text-white/50 mt-2">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
 
