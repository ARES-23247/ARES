import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HybridSimulationWrapper } from '../components/science-corner/HybridSimulationWrapper';

// Mock lesson config
const lessonConfig: Record<string, { title: string, description: string, engine: 'matter' | 'canvas' | 'dyn4j' }> = {
  'kinematics-1': {
    title: 'Basic Kinematics',
    description: 'Use your mouse to drag the shapes. Notice how gravity affects them.',
    engine: 'matter'
  },
  'trig-circle': {
    title: 'Unit Circle Explorer',
    description: 'A simple bouncing ball simulation demonstrating x/y vector updates.',
    engine: 'canvas'
  },
  'dyn4j-test': {
    title: 'FTC Chassis Demo',
    description: 'Waiting for telemetry to demonstrate mecanum kinematics.',
    engine: 'dyn4j'
  }
};

export default function ScienceCornerLesson() {
  const { id } = useParams<{ id: string }>();
  const lesson = id ? lessonConfig[id] : null;

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <h1 className="text-4xl font-bold mb-4">Lesson Not Found</h1>
        <p className="text-slate-400 mb-8">The experiment you are looking for does not exist.</p>
        <Link to="/science-corner" className="px-6 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
          Return to Science Corner
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <Link 
          to="/science-corner" 
          className="text-slate-400 hover:text-white transition-colors flex items-center text-sm font-medium"
        >
          <span className="mr-2">←</span> Back to Library
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <HybridSimulationWrapper 
          engineType={lesson.engine}
          experimentId={`science-corner-${id}`}
          title={lesson.title}
          description={lesson.description}
        />
      </motion.div>
    </div>
  );
}
