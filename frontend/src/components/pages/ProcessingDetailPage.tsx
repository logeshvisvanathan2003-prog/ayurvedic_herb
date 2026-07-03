import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Thermometer, Wind, Clock, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PROCESSING_DETAILS = [
  {
    id: 'processing-1',
    name: 'Central Processing Unit - Delhi',
    batchId: 'BATCH-2024-001',
    status: 'In Progress',
    receivedDate: '2024-02-16',
    processingMethod: 'Solar Drying',
    temperature: '35-40°C',
    humidity: '15-20%',
    duration: '7-10 days',
    image: 'https://static.wixstatic.com/media/153483_ada74be1cb1c4d84a258a1dc7c1240a8~mv2.png?originWidth=1152&originHeight=576',
    description: 'State-of-the-art processing facility with climate-controlled drying chambers and modern grinding equipment.',
    stages: ['Cleaning', 'Drying', 'Grinding', 'Packaging'],
    currentStage: 'Drying',
    qualityChecks: ['Moisture Analysis', 'Contamination Check', 'Size Uniformity']
  },
  {
    id: 'processing-2',
    name: 'Himalayan Processing Center - Himachal',
    batchId: 'BATCH-2024-002',
    status: 'Completed',
    receivedDate: '2024-02-10',
    processingMethod: 'Shade Drying',
    temperature: '25-30°C',
    humidity: '20-25%',
    duration: '12-15 days',
    image: 'https://static.wixstatic.com/media/153483_23b317b6cd3a49b7a2f33e16514f4d91~mv2.png?originWidth=1152&originHeight=576',
    description: 'Traditional processing center using time-honored methods combined with modern quality control.',
    stages: ['Cleaning', 'Drying', 'Sorting', 'Packaging'],
    currentStage: 'Packaging',
    qualityChecks: ['Moisture Analysis', 'Purity Test', 'Aroma Assessment']
  },
  {
    id: 'processing-3',
    name: 'Kerala Processing Hub - Kochi',
    batchId: 'BATCH-2024-003',
    status: 'In Progress',
    receivedDate: '2024-02-13',
    processingMethod: 'Mechanical Drying',
    temperature: '40-45°C',
    humidity: '10-15%',
    duration: '5-7 days',
    image: 'https://static.wixstatic.com/media/153483_dd9b6cb641534033910a55fea8b47e9d~mv2.png?originWidth=1152&originHeight=576',
    description: 'Advanced processing facility with automated systems for consistent quality and high throughput.',
    stages: ['Cleaning', 'Drying', 'Grinding', 'Quality Check', 'Packaging'],
    currentStage: 'Grinding',
    qualityChecks: ['Moisture Analysis', 'Microbial Test', 'Particle Size']
  }
];

export default function ProcessingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const processing = PROCESSING_DETAILS.find(p => p.id === id);

  if (!processing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="w-full py-20 bg-background">
          <div className="max-w-[100rem] mx-auto px-6 md:px-12 text-center">
            <h1 className="font-heading text-4xl text-secondary mb-4">Processing Unit Not Found</h1>
            <button
              onClick={() => navigate('/processing-unit')}
              className="px-6 py-3 bg-primary text-primary-foreground font-heading uppercase hover:bg-highlightyellow hover:text-secondary transition-colors"
            >
              Back to Processing Unit
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const statusColor = processing.status === 'Completed' ? 'bg-green-600' : 'bg-primary';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button */}
      <section className="w-full py-6 bg-background border-b border-secondary/10">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <button
            onClick={() => navigate('/processing-unit')}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-heading text-sm uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Processing Unit
          </button>
        </div>
      </section>

      {/* Hero Section */}
      <section className="w-full py-12 bg-highlightyellow">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`${statusColor} text-white px-4 py-2 font-heading text-sm uppercase`}>
                  {processing.status}
                </span>
              </div>
              <h1 className="font-heading text-5xl md:text-6xl text-secondary uppercase mb-4">
                {processing.name}
              </h1>
              <p className="font-paragraph text-lg text-secondary/80 mb-6">
                {processing.description}
              </p>
              <div className="flex items-center gap-2 text-secondary mb-4">
                <Package className="w-5 h-5" />
                <span className="font-paragraph text-base">Batch ID: {processing.batchId}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] md:h-[500px]"
            >
              <Image
                src={processing.image}
                alt={processing.name}
                width={600}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Processing Parameters */}
      <section className="w-full py-16 bg-background">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-heading text-4xl text-secondary uppercase mb-4">
              Processing Parameters
            </h2>
            <p className="font-paragraph text-base text-secondary/80">
              Environmental conditions and processing specifications
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Thermometer,
                label: 'Temperature',
                value: processing.temperature,
                color: 'bg-primary'
              },
              {
                icon: Wind,
                label: 'Humidity',
                value: processing.humidity,
                color: 'bg-highlightyellow'
              },
              {
                icon: Clock,
                label: 'Duration',
                value: processing.duration,
                color: 'bg-secondary'
              },
              {
                icon: Package,
                label: 'Method',
                value: processing.processingMethod,
                color: 'bg-primary'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`${item.color} p-6 text-primary-foreground`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className="w-6 h-6" />
                  <span className="font-heading text-sm uppercase">{item.label}</span>
                </div>
                <p className="font-heading text-2xl">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Processing Stages */}
      <section className="w-full py-16 bg-secondary">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-heading text-4xl text-secondary-foreground uppercase mb-4">
              Processing Stages
            </h2>
            <p className="font-paragraph text-base text-secondary-foreground/80">
              Current stage: <span className="font-heading text-primary">{processing.currentStage}</span>
            </p>
          </motion.div>

          <div className="space-y-4">
            {processing.stages.map((stage, index) => {
              const isCompleted = processing.stages.indexOf(processing.currentStage) > index;
              const isCurrent = stage === processing.currentStage;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`p-6 flex items-center gap-4 ${
                    isCurrent
                      ? 'bg-highlightyellow text-secondary border-2 border-secondary'
                      : isCompleted
                      ? 'bg-background border-2 border-green-600'
                      : 'bg-background border-2 border-secondary-foreground/20'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-heading text-lg ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-secondary-foreground/20 text-secondary'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl uppercase">{stage}</h3>
                    {isCurrent && (
                      <p className="font-paragraph text-sm mt-1">Currently in progress</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quality Checks */}
      <section className="w-full py-16 bg-background">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-heading text-4xl text-secondary uppercase mb-4">
              Quality Control Checks
            </h2>
            <p className="font-paragraph text-base text-secondary/80">
              Comprehensive testing performed during processing
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processing.qualityChecks.map((check, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="bg-primary p-8 text-center text-primary-foreground border-2 border-primary hover:border-highlightyellow transition-colors"
              >
                <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                <h3 className="font-heading text-xl uppercase">{check}</h3>
                <p className="font-paragraph text-sm mt-2 text-primary-foreground/70">
                  Quality verification
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="w-full py-16 bg-primary">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-primary-foreground"
          >
            <h2 className="font-heading text-4xl uppercase mb-12">Processing Timeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Received', date: processing.receivedDate },
                { label: 'Current Stage', date: processing.currentStage },
                { label: 'Expected Completion', date: 'In Progress' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-primary-foreground/10 p-6"
                >
                  <p className="font-paragraph text-sm text-primary-foreground/70 uppercase mb-2">
                    {item.label}
                  </p>
                  <p className="font-heading text-2xl">{item.date}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
