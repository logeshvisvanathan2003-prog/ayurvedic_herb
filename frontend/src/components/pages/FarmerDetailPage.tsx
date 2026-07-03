import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Package, User, Leaf } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const FARMER_DETAILS = [
  {
    id: 'farmer-1',
    name: 'Rajesh Kumar',
    location: 'Himachal Pradesh',
    coordinates: '32.1539° N, 77.1797° E',
    herbsCollected: ['Ashwagandha', 'Brahmi', 'Tulsi'],
    totalHarvest: '250 kg',
    harvestDate: '2024-02-15',
    image: 'https://static.wixstatic.com/media/153483_ada74be1cb1c4d84a258a1dc7c1240a8~mv2.png?originWidth=1152&originHeight=576',
    description: 'Experienced herb collector with 15 years of traditional knowledge in medicinal plant harvesting.',
    batchId: 'BATCH-2024-001',
    moistureLevel: '12.5%',
    quality: 'Premium'
  },
  {
    id: 'farmer-2',
    name: 'Priya Sharma',
    location: 'Uttarakhand',
    coordinates: '30.0668° N, 79.0193° E',
    herbsCollected: ['Jatamansi', 'Sarpagandha', 'Neem'],
    totalHarvest: '180 kg',
    harvestDate: '2024-02-10',
    image: 'https://static.wixstatic.com/media/153483_23b317b6cd3a49b7a2f33e16514f4d91~mv2.png?originWidth=1152&originHeight=576',
    description: 'Certified organic farmer specializing in rare medicinal herbs with sustainable harvesting practices.',
    batchId: 'BATCH-2024-002',
    moistureLevel: '11.8%',
    quality: 'Premium'
  },
  {
    id: 'farmer-3',
    name: 'Vikram Singh',
    location: 'Kerala',
    coordinates: '10.8505° N, 76.2711° E',
    herbsCollected: ['Brahmi', 'Bacopa', 'Gotu Kola'],
    totalHarvest: '320 kg',
    harvestDate: '2024-02-12',
    image: 'https://static.wixstatic.com/media/153483_dd9b6cb641534033910a55fea8b47e9d~mv2.png?originWidth=1152&originHeight=576',
    description: 'Traditional farmer with expertise in tropical medicinal plants and sustainable forest management.',
    batchId: 'BATCH-2024-003',
    moistureLevel: '13.2%',
    quality: 'Standard'
  }
];

export default function FarmerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const farmer = FARMER_DETAILS.find(f => f.id === id);

  if (!farmer) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="w-full py-20 bg-background">
          <div className="max-w-[100rem] mx-auto px-6 md:px-12 text-center">
            <h1 className="font-heading text-4xl text-secondary mb-4">Farmer Not Found</h1>
            <button
              onClick={() => navigate('/farmer-portal')}
              className="px-6 py-3 bg-primary text-primary-foreground font-heading uppercase hover:bg-highlightyellow hover:text-secondary transition-colors"
            >
              Back to Farmer Portal
            </button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Back Button */}
      <section className="w-full py-6 bg-background border-b border-secondary/10">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <button
            onClick={() => navigate('/farmer-portal')}
            className="flex items-center gap-2 text-secondary hover:text-primary transition-colors font-heading text-sm uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </button>
        </div>
      </section>

      {/* Hero Section with Image */}
      <section className="w-full py-12 bg-primary">
        <div className="max-w-[100rem] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-5xl md:text-6xl text-primary-foreground uppercase mb-4">
                {farmer.name}
              </h1>
              <p className="font-paragraph text-lg text-primary-foreground/90 mb-6">
                {farmer.description}
              </p>
              <div className="flex items-center gap-2 text-primary-foreground mb-4">
                <MapPin className="w-5 h-5" />
                <span className="font-paragraph text-base">{farmer.location}</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <Package className="w-5 h-5" />
                <span className="font-paragraph text-base">Batch ID: {farmer.batchId}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative h-[400px] md:h-[500px]"
            >
              <Image
                src={farmer.image}
                alt={farmer.name}
                width={600}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Information Section */}
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
              Harvest Information
            </h2>
            <p className="font-paragraph text-base text-secondary/80">
              Complete details of the collected batch
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                label: 'Harvest Date',
                value: farmer.harvestDate,
                color: 'bg-primary'
              },
              {
                icon: Package,
                label: 'Total Harvest',
                value: farmer.totalHarvest,
                color: 'bg-highlightyellow'
              },
              {
                icon: Leaf,
                label: 'Moisture Level',
                value: farmer.moistureLevel,
                color: 'bg-secondary'
              },
              {
                icon: User,
                label: 'Quality Grade',
                value: farmer.quality,
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

      {/* Herbs Collected */}
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
              Herbs Collected
            </h2>
            <p className="font-paragraph text-base text-secondary-foreground/80">
              Species harvested in this batch
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {farmer.herbsCollected.map((herb, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="bg-background p-8 text-center border-2 border-secondary-foreground/20 hover:border-highlightyellow transition-colors"
              >
                <Leaf className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-2xl text-secondary uppercase">{herb}</h3>
                <p className="font-paragraph text-sm text-secondary/70 mt-2">
                  Medicinal herb species
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Details */}
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
              Collection Location
            </h2>
            <p className="font-paragraph text-base text-secondary/80">
              GPS coordinates and geographical information
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-primary p-8 md:p-12 text-primary-foreground"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-heading text-2xl uppercase mb-4">Region Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-paragraph text-sm text-primary-foreground/70 uppercase">Location</p>
                    <p className="font-heading text-xl">{farmer.location}</p>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-primary-foreground/70 uppercase">GPS Coordinates</p>
                    <p className="font-heading text-xl">{farmer.coordinates}</p>
                  </div>
                </div>
              </div>
              <div className="bg-primary-foreground/10 p-6 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="font-paragraph text-sm text-primary-foreground/70">
                    Map visualization available in full system
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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
              Next Steps in Supply Chain
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Processing Unit', desc: 'Batch moves to processing center' },
                { step: '2', title: 'Laboratory Testing', desc: 'Quality and authenticity verification' },
                { step: '3', title: 'Consumer Portal', desc: 'Product available for verification' }
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
