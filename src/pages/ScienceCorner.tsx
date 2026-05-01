import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const lessons = [
  {
    id: 'kinematics-1',
    title: 'Basic Kinematics',
    description: 'Learn about velocity and acceleration with a 2D physics sandbox.',
    engine: 'matter',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'trig-circle',
    title: 'Unit Circle Explorer',
    description: 'Interactive sine and cosine visualization.',
    engine: 'canvas',
    color: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'dyn4j-test',
    title: 'FTC Chassis Demo',
    description: 'Teleop simulation of a standard mecanum drive.',
    engine: 'dyn4j',
    color: 'from-ares-red to-orange-600'
  }
];

export default function ScienceCorner() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
          >
            Science Corner
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Interactive experiments, physics sandboxes, and mathematical models to help you understand the principles behind robotics.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson, idx) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link 
                to={`/science-corner/${lesson.id}`}
                className="block h-full bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all hover:shadow-2xl hover:shadow-blue-900/20 group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${lesson.color} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {lesson.title}
                  </h3>
                  <span className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-mono rounded">
                    {lesson.engine}
                  </span>
                </div>
                
                <p className="text-slate-400 text-sm">
                  {lesson.description}
                </p>
                
                <div className="mt-6 flex items-center text-cyan-500 text-sm font-medium group-hover:translate-x-1 transition-transform">
                  Launch Experiment <span className="ml-2">→</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
