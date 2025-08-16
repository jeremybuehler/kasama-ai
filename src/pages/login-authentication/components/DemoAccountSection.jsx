import React from "react";
import { motion } from "framer-motion";
import { PlayCircle, Info } from "lucide-react";
import Button from "../../../components/ui/Button";

const DemoAccountSection = ({ onDemoLogin }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Info className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-800 mb-1">
              Try Demo Account
            </h3>
            <p className="text-xs text-gray-600">
              Experience Kasama's features with our pre-configured demo account
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-mono text-gray-800">
                  pamela.buehler@example.com
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Password:</span>
                <span className="font-mono text-gray-800">demopassword123</span>
              </div>
            </div>
          </div>

          <Button
            onClick={onDemoLogin}
            variant="outline"
            size="sm"
            fullWidth
            iconName="PlayCircle"
            iconPosition="left"
            className="border-blue-200 text-blue-700 hover:bg-blue-50 transition-gentle"
          >
            Use Demo Account
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoAccountSection;
