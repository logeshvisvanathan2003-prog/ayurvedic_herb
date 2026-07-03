import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, MapPin, FileCheck, Download, Shield, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CONSUMER_PRODUCTS = [
  {
    id: 'product-1',
    name: 'Premium Ashwagandha Extract',
    batchId: 'BATCH-2024-001',
    qrCode: 'https://static.wixstatic.com/media/153483_ada74be1cb1c4d84a258a1dc7c1240a8~mv2.png?originWidth=1152&originHeight=576',
    image: 'https://static.wixstatic.com/media/153483_ada74be1cb1c4d84a258a1dc7c1240a8~mv2.png?originWidth=1152&originHeight=576',
    description: 'High-quality Ashwagandha root extract with verified authenticity and purity.',
    farmer: 'Rajesh Kumar',
    farmerLocation: 'Himachal Pradesh',
    harvestDate: '2024-02-15',
    processingUnit: 'Central Processing Unit - Delhi',
    processingDate: '2024-02-18',
    laboratory: 'Central Testing Laboratory - Delhi',
    testDate: '2024-02-20',
    status: 'Verified & Approved',
    certifications: ['ISO 17025', 'NABL Accredited', 'WHO GMP Certified'],
    testResults: {
      authenticity: 'Confirmed - DNA Verified',
      purity: '99.2%',
      pesticides: 'Not Detected',
      heavyMetals: 'Within WHO Limits',
      microbial: '<1000 CFU/g'
    }
  },
  {
    id: 'product-2',
    name: 'Organic Brahmi Powder',
    batchId: 'BATCH-2024-002',
    qrCode: 'https://static.wixstatic.com/media/153483_23b317b6cd3a49b7a2f33e16514f4d91~mv2.png?originWidth=1152&originHeight=576',
    image: 'https://static.wixstatic.com/media/153483_23b317b6cd3a49b7a2f33e16514f4d91~mv2.png?originWidth=1152&originHeight=576',
    description: 'Pure Brahmi powder from certified organic farms with complete traceability.',
    farmer: 'Priya Sharma',
    farmerLocation: 'Uttarakhand',
    harvestDate: '2024-02-10',
    processingUnit: 'Himalayan Processing Center - Himachal',
    processingDate: '2024-02-15',
    laboratory: 'Himalayan Quality Testing Center - Himachal',
    testDate: '2024-02-17',
    status: 'Verified & Approved',
    certifications: ['ISO 17025', 'AYUSH Certified', 'FSSAI Approved'],
    testResults: {
      authenticity: 'Confirmed - DNA Verified',
      purity: '98.8%',
      pesticides: 'Not Detected',
      heavyMetals: 'Within WHO Limits',
      microbial: '<500 CFU/g'
    }
  },
  {
    id: 'product-3',
    name: 'Tulsi & Gotu Kola Blend',
    batchId: 'BATCH-2024-003',
    qrCode: 'https://static.wixstatic.com/media/153483_dd9b6cb641534033910a55fea8b47e9d~mv2.png?originWidth=1152&originHeight=576',
    image: 'https://static.wixstatic.com/media/153483_dd9b6cb641534033910a55fea8b47e9d~mv2.png?originWidth=1152&originHeight=576',
    description: 'Carefully blended herbal mixture from multiple verified sources.',
    farmer: 'Vikram Singh',
    farmerLocation: 'Kerala',
    harvestDate: '2024-02-12',
    processingUnit: 'Kerala Processing Hub - Kochi',
    processingDate: '2024-02-19',
    laboratory: 'Kerala Advanced Testing Lab - Kochi',
    testDate: 'In Progress',
    status: 'Testing in Progress',
    certifications: ['ISO 17025', 'NABL Accredited', 'AYUSH Recognized'],
    testResults: {
      authenticity: 'Pending',
      purity: 'Pending',
      pesticides: 'Pending',
      heavyMetals: 'Pending',
      microbial: 'Pending'
    }
  }
];

export default function ConsumerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = CONSUMER_PRODUCTS.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="w-full py-20 bg-background">
          <div className="max-w-[100rem] mx-auto px-6 md:px-12 text-center">
            <h1 className="font-heading text-4xl text-secondary mb-4">Product Not Found</h1>
            <button
              onClick={() => navigate('/consumer-portal')}
              className="px-6 py-3 bg-primary text-primary-foreground font-heading uppercase hover:bg-highlightyellow hover:text-secondary transition-colors"
            >
              Back to Consumer Portal
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const isApproved = product.status === 'Verified & Approved';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button */}
      <section className="w-full py-6 bg-background border-b border-secondary/10">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <button
            onClick={() => navigate('/consumer-portal')}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-heading text-sm uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Consumer Portal
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
                <span className={`${isApproved ? 'bg-green-600' : 'bg-primary'} text-white px-4 py-2 font-heading text-sm uppercase`}>
                  {product.status}
                </span>
              </div>
              <h1 className="font-heading text-5xl md:text-6xl text-secondary uppercase mb-4">
                {product.name}
              </h1>
              <p className="font-paragraph text-lg text-secondary/80 mb-6">
                {product.description}
              </p>
              <div className="flex items-center gap-2 text-secondary mb-4">
                <QrCode className="w-5 h-5" />
                <span className="font-paragraph text-base">Batch ID: {product.batchId}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] md:h-[500px]"
            >
              <Image
                src={product.image}
                alt={product.name}
                width={600}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Supply Chain Journey */}
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
              Complete Supply Chain Journey
            </h2>
            <p className="font-paragraph text-base text-secondary/80">
              Track this product from farm to your hands
            </p>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                stage: 'Farm Collection',
                title: product.farmer,
                location: product.farmerLocation,
                date: product.harvestDate,
                icon: Leaf,
                color: 'bg-primary'
              },
              {
                stage: 'Processing',
                title: product.processingUnit,
                location: 'Processing Center',
                date: product.processingDate,
                icon: CheckCircle,
                color: 'bg-highlightyellow'
              },
              {
                stage: 'Laboratory Testing',
                title: product.laboratory,
                location: 'Testing Facility',
                date: product.testDate,
                icon: FileCheck,
                color: 'bg-secondary'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex gap-6 items-start"
              >
                <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <item.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1 bg-background border-2 border-secondary/20 p-6 hover:border-primary transition-colors">
                  <p className="font-heading text-sm text-secondary/70 uppercase mb-1">{item.stage}</p>
                  <h3 className="font-heading text-2xl text-secondary mb-2">{item.title}</h3>
                  <div className="flex flex-col md:flex-row gap-4 text-secondary/70">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-paragraph text-sm">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-paragraph text-sm">{item.date}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Test Results */}
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
              Laboratory Test Results
            </h2>
            <p className="font-paragraph text-base text-secondary-foreground/80">
              Comprehensive quality and safety verification
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(product.testResults).map(([key, value], index) => {
              const isPending = value === 'Pending';
              const isPass = !isPending;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className={`p-6 ${isPending ? 'bg-primary/20 border-2 border-primary' : 'bg-green-50 border-2 border-green-600'}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {isPending ? (
                      <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <p className="font-heading text-sm text-secondary uppercase">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                  <p className="font-heading text-lg text-secondary">{value}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
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
              Quality Certifications
            </h2>
            <p className="font-paragraph text-base text-secondary/80">
              Verified by accredited testing laboratories
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {product.certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="bg-primary p-8 text-center text-primary-foreground border-2 border-primary hover:border-highlightyellow transition-colors"
              >
                <Shield className="w-12 h-12 mx-auto mb-4" />
                <h3 className="font-heading text-xl uppercase">{cert}</h3>
                <p className="font-paragraph text-sm mt-2 text-primary-foreground/70">
                  Verified certification
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Consumer Assurance */}
      {isApproved && (
        <section className="w-full py-16 bg-green-50">
          <div className="max-w-[100rem] mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-green-600 text-white p-8 md:p-12"
            >
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-3xl uppercase mb-4">
                    Product Verified & Safe
                  </h3>
                  <p className="font-paragraph text-lg mb-6">
                    This product has passed all quality tests and is certified safe for consumption. You can purchase with confidence knowing the complete supply chain has been verified.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-6 py-3 bg-white text-green-600 font-heading uppercase hover:bg-green-50 transition-colors">
                      Download Certificate
                    </button>
                    <button className="px-6 py-3 border-2 border-white text-white font-heading uppercase hover:bg-white/10 transition-colors">
                      Share Results
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Why This Matters */}
      <section className="w-full py-16 bg-primary">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-primary-foreground"
          >
            <h2 className="font-heading text-4xl uppercase mb-12">Why Traceability Matters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Authenticity', desc: 'Verify genuine herbs without adulteration' },
                { title: 'Safety', desc: 'Confirm absence of harmful contaminants' },
                { title: 'Trust', desc: 'Know the complete journey of your product' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-primary-foreground/10 p-6"
                >
                  <h3 className="font-heading text-2xl uppercase mb-3">{item.title}</h3>
                  <p className="font-paragraph text-base text-primary-foreground/80">{item.desc}</p>
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
