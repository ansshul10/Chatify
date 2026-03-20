import { useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

// ── Magnetic Effect Hook ────────────────────────────────────────────────────
const useMagnetic = (strength = 0.4) => {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el   = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x    = e.clientX - (rect.left + rect.width  / 2);
    const y    = e.clientY - (rect.top  + rect.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0px, 0px)";
  };

  return { ref, handleMouseMove, handleMouseLeave };
};

// ── Primary Glow Button ──────────────────────────────────────────────────────
export const PrimaryButton = ({ children, onClick, href, type = "button",
  size = "md", disabled = false, loading = false, className = "" }) => {

  const { ref, handleMouseMove, handleMouseLeave } = useMagnetic(0.3);

  const sizes = {
    sm: "px-5  py-2   text-sm",
    md: "px-7  py-3   text-sm",
    lg: "px-10 py-4   text-base",
  };

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      whileTap={{   scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold
                  bg-gradient-to-r from-primary-500 to-purple-600 text-white
                  transition-all duration-300 cursor-pointer select-none
                  hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${sizes[size]} ${className}`}
      style={{ transition: "transform 0.15s ease" }}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : null}
      {children}
    </motion.div>
  );

  if (href) return <Link to={href}>{content}</Link>;

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}>
      {content}
    </button>
  );
};

// ── Ghost / Outline Button ───────────────────────────────────────────────────
export const GhostButton = ({ children, onClick, href, type = "button",
  size = "md", className = "" }) => {

  const { ref, handleMouseMove, handleMouseLeave } = useMagnetic(0.3);

  const sizes = {
    sm: "px-5  py-2  text-sm",
    md: "px-7  py-3  text-sm",
    lg: "px-10 py-4  text-base",
  };

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      whileTap={{   scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold
                  border border-white/20 text-white/80 hover:text-white
                  hover:border-primary-500 hover:bg-primary-500/10
                  transition-all duration-300 cursor-pointer select-none
                  ${sizes[size]} ${className}`}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link to={href}>{content}</Link>;
  return <button type={type} onClick={onClick}>{content}</button>;
};

export default PrimaryButton;
 
