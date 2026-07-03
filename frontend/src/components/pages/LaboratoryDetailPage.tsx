import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck, Microscope, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const LABORATORY_DETAILS = [
  {
    id: 'lab-1',
    name: 'Central Testing Laboratory - Delhi',
    batchId: 'BATCH-2024-001',
    status: 'Approved',
    testDate: '2024-02-18',
    image: 'https://static.wixstatic.com/media/153483_ada74be1cb1c4d84a258a1dc7c1240a8~mv2.png?originWidth=1152&originHeight=576',
    description: 'ISO 17025 accredited laboratory with state-of-the-art testing equipment and certified analysts.',
    tests: [
      { name: 'Moisture Content', result: '12.5%', status: 'Pass', reference: '<14%' },
      { name: 'Pesticide Residue', result: 'Not Detected', status: 'Pass', reference: 'ND' },
      { name: 'Heavy Metals', result: 'Within Limits', status: 'Pass', reference: 'WHO Standards' },
      { name: 'Microbial Count', result: '<1000 CFU/g', status: 'Pass', reference: '<10000 CFU/g' },
      { name: 'DNA Authentication', result: 'Ashwagandha Confirmed', status: 'Pass', reference: 'Species Match' },
      { name: 'Aflatoxin', result: 'Not Detected', status: 'Pass', reference: 'ND' }
    ],
    certifications: ['ISO 17025', 'NABL Accredited', 'WHO GMP Certified'],
    approvalDate: '2024-02-20',
    validUntil: '2025-02-20'
  },
  {
    id: 'lab-2',
    name: 'Himalayan Quality Testing Center - Himachal',
    batchId: 'BATCH-2024-002',
    status: 'Approved',
    testDate: '2024-02-15',
    image: 'https://static.wixstatic.com/media/153483_23b317b6cd3a49b7a2f33e16514f4d91~mv2.png?originWidth=1152&originHeight=576',
    description: 'Specialized laboratory for Ayurvedic product testing with traditional and modern methods.',
    tests: [
      { name: 'Moisture Content', result: '11.8%', status: 'Pass', reference: '<14%' },
      { name: 'Pesticide Residue', result: 'Not Detected', status: 'Pass', reference: 'ND' },
      { name: 'Heavy Metals', result: 'Within Limits', status: 'Pass', reference: 'WHO Standards' },
      { name: 'Microbial Count', result: '<500 CFU/g', status: 'Pass', reference: '<10000 CFU/g' },
      { name: 'DNA Authentication', result: 'Brahmi Confirmed', status: 'Pass', reference: 'Species Match' },
      { name: 'Phytochemical Analysis', result: 'Positive', status: 'Pass', reference: 'Expected Markers' }
    ],
    certifications: ['ISO 17025', 'AYUSH Certified', 'FSSAI Approved'],
    approvalDate: '2024-02-17',
    validUntil: '2025-02-17'
  },
  {
    id: 'lab-3',
    name: 'Kerala Advanced Testing Lab - Kochi',
    batchId: 'BATCH-2024-003',
    status: 'Pending',
    testDate: '2024-02-19',
    image: 'https://static.wixstatic.com/media/153483_dd9b6cb641534033910a55fea8b47e9d~mv2.png?originWidth=1152&originHeight=576',
    description: 'Advanced laboratory with modern analytical instruments and experienced team of scientists.',
    tests: [
      { name: 'Moisture Content', result: 'Testing in Progress', status: 'Pending', reference: '<14%' },
      { name: 'Pesticide Residue', result: 'Testing in Progress', status: 'Pending', reference: 'ND' },
      { name: 'Heavy Metals', result: 'Testing in Progress', status: 'Pending', reference: 'WHO Standards' },
      { name: 'Microbial Count', result: 'Testing in Progress', status: 'Pending', reference: '<10000 CFU/g' },
      { name: 'DNA Authentication', result: 'Testing in Progress', status: 'Pending', reference: 'Species Match' },
      { name: 'Chromatography Analysis', result: 'Testing in Progress', status: 'Pending', reference: 'Expected Profile' }
    ],
    certifications: ['ISO 17025', 'NABL Accredited', 'AYUSH Recognized'],
    approvalDate: null,
    validUntil: null
  }
];

export default function LaboratoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const laboratory = LABORATORY_DETAILS.find(l => l.id === id);

  if (!laboratory) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="w-full py-20 bg-background">
          <div className="max-w-[100rem] mx-auto px-6 md:px-12 text-center">
            <h1 className="font-heading text-4xl text-secondary mb-4">Laboratory Not Found</h1>
            <button
              onClick={() => navigate('/laboratory-testing')}
              className="px-6 py-3 bg-primary text-primary-foreground font-heading uppercase hover:bg-highlightyellow hover:text-secondary transition-colors"
            >
              Back to Laboratory Testing
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const statusColor = laboratory.status === 'Approved' ? 'bg-green-600' : laboratory.status === 'Pending' ? 'bg-primary' : 'bg-red-600';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button */}
      <section className="w-full py-6 bg-background border-b border-secondary/10">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <button
            onClick={() => navigate('/laboratory-testing')}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-heading text-sm uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Laboratory Testing
          </button>
        </div>
      </section>

      {/* Hero Section */}
      <section className="w-full py-12 bg-secondary">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`${statusColor} text-white px-4 py-2 font-heading text-sm uppercase`}>
                  {laboratory.status}
                </span>
              </div>
              <h1 className="font-heading text-5xl md:text-6xl text-secondary-foreground uppercase mb-4">
                {laboratory.name}
              </h1>
              <p className="font-paragraph text-lg text-secondary-foreground/80 mb-6">
                {laboratory.description}
              </p>
              <div className="flex items-center gap-2 text-secondary-foreground mb-4">
                <FileCheck className="w-5 h-5" />
                <span className="font-paragraph text-base">Batch ID: {laboratory.batchId}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] md:h-[500px]"
            >
              <Image
                src={laboratory.image}
                alt={laboratory.name}
                width={600}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Test Results */}
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
              Test Results
            </h2>
            <p className="font-paragraph text-base text-secondary/80">
              Comprehensive laboratory analysis and quality verification
            </p>
          </motion.div>

          <div className="space-y-4">
            {laboratory.tests.map((test, index) => {
              const isPass = test.status === 'Pass';
              const isPending = test.status === 'Pending';

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className={`p-6 border-2 ${
                    isPass
                      ? 'bg-green-50 border-green-600'
                      : isPending
                      ? 'bg-primary/10 border-primary'
                      : 'bg-red-50 border-red-600'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      {isPass ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : isPending ? (
                        <AlertCircle className="w-6 h-6 text-primary" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                      <h3 className="font-heading text-lg text-secondary">{test.name}</h3>
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-secondary/70 uppercase">Result</p>
                      <p className="font-heading text-base">{test.result}</p>
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-secondary/70 uppercase">Reference</p>
                      <p className="font-heading text-base">{test.reference}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-4 py-2 font-heading text-sm uppercase ${
                          isPass
                            ? 'bg-green-600 text-white'
                            : isPending
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="w-full py-16 bg-primary">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="font-heading text-4xl text-primary-foreground uppercase mb-4">
              Laboratory Certifications
            </h2>
            <p className="font-paragraph text-base text-primary-foreground/80">
              Accreditations and quality standards
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {laboratory.certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="bg-primary-foreground/10 p-8 text-center border-2 border-primary-foreground/20 hover:border-highlightyellow transition-colors"
              >
                <Shield className="w-12 h-12 text-highlightyellow mx-auto mb-4" />
                <h3 className="font-heading text-xl text-primary-foreground uppercase">{cert}</h3>
                <p className="font-paragraph text-sm text-primary-foreground/70 mt-2">
                  Verified certification
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Approval Status */}
      {laboratory.status === 'Approved' && (
        <section className="w-full py-16 bg-background">
          <div className="max-w-[100rem] mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-green-50 border-2 border-green-600 p-8"
            >
              <div className="flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-2xl text-secondary uppercase mb-4">
                    Batch Approved for Market
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="font-paragraph text-sm text-secondary/70 uppercase mb-1">Approval Date</p>
                      <p className="font-heading text-lg">{laboratory.approvalDate}</p>
                    </div>
                    <div>
                      <p className="font-paragraph text-sm text-secondary/70 uppercase mb-1">Valid Until</p>
                      <p className="font-heading text-lg">{laboratory.validUntil}</p>
                    </div>
                  </div>
                  <p className="font-paragraph text-base text-secondary/80 mt-4">
                    This batch has passed all quality tests and is approved for consumer distribution.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Next Steps */}
      <section className="w-full py-16 bg-highlightyellow">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="font-heading text-4xl text-secondary uppercase mb-6">
              Supply Chain Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '✓', title: 'Farmer Collection', desc: 'Batch collected and registered' },
                { step: '✓', title: 'Processing', desc: 'Batch processed and prepared' },
                { step: laboratory.status === 'Approved' ? '✓' : '⏳', title: 'Laboratory Testing', desc: laboratory.status === 'Approved' ? 'Batch tested and approved' : 'Testing in progress' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-secondary p-6 text-secondary-foreground"
                >
                  <div className="font-heading text-4xl mb-3">{item.step}</div>
                  <h3 className="font-heading text-xl uppercase mb-2">{item.title}</h3>
                  <p className="font-paragraph text-sm">{item.desc}</p>
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
