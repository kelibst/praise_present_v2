import { ChurchIcon } from "lucide-react";
import React from "react";
import { FiPlus, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Import images with correct paths
/* @ts-ignore */
import logoDark from "../assets/logo-dark.png";
/* @ts-ignore */
import logoLight from "../assets/logo-white.png";
import { useTheme } from "@/lib/theme";

const Homepage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
        duration: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  const circleVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 0.3,
      transition: {
        delay: 0.5,
        duration: 1.2,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 1.2,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
      },
    },
  };

  return (
    <motion.div
      className="flex min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Centered Content */}
      <div className="flex flex-col justify-center items-center w-full bg-gradient-to-b from-blue-500 to-purple-500 dark:from-blue-900 dark:to-purple-900 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30"
          style={{ transform: "translate(-30%,-30%)" }}
          variants={circleVariants}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full border-4 border-blue-400 opacity-30"
          style={{ transform: "translate(30%,30%)" }}
          variants={circleVariants}
        />

        {/* Logo */}
        <motion.div className="relative" variants={logoVariants}>
          <motion.img
            src={theme === "dark" ? logoLight : logoDark}
            alt="PraisePresent Logo"
            className="w-48 h-48 object-contain rounded-full my-6"
            initial={{ rotate: -5 }}
            animate={{ rotate: 5 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 3,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Text Elements */}
        <motion.h1
          className="text-4xl font-bold mb-2 text-center"
          variants={itemVariants}
        >
          PraisePresent
        </motion.h1>

        <motion.p
          className="text-xl mb-10 opacity-90 text-center max-w-md"
          variants={itemVariants}
        >
          Create beautiful worship presentations for your church
        </motion.p>

        {/* Button */}
        <motion.div variants={buttonVariants} whileHover="hover">
          <button
            className="flex items-center gap-2 bg-white hover:scale-105 text-black font-semibold px-8 py-4 rounded-full shadow-lg hover:bg-blue-50 transition"
            onClick={() => navigate("/live")}
          >
            <FiPlus /> Start New Service
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Homepage;
