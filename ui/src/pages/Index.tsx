import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import DiaryWriter from '@/components/DiaryWriter';
import DiaryList from '@/components/DiaryList';
import { Wallet, Plane, MapPin, Compass, Globe, Camera, Mountain, Palmtree, Ship, Sunrise } from 'lucide-react';
import { useEffect, useState } from 'react';

// 装饰性浮动图标组件
const FloatingIcon = ({ 
  icon: Icon, 
  className, 
  delay = 0 
}: { 
  icon: React.ElementType; 
  className: string; 
  delay?: number;
}) => (
  <div 
    className={`absolute pointer-events-none opacity-10 ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    <Icon className="w-full h-full" />
  </div>
);

// 装饰性背景斑点
const DecorativeBlob = ({ className }: { className: string }) => (
  <div className={`decorative-blob ${className}`} />
);

// 装饰性圆环
const DecorativeRing = ({ className, size }: { className: string; size: number }) => (
  <div 
    className={`decorative-ring animate-pulse-glow ${className}`}
    style={{ width: size, height: size }}
  />
);

const Index = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 未连接钱包时的欢迎页面
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-pattern-dots" />
        <DecorativeBlob className="w-96 h-96 bg-primary -top-48 -left-48" />
        <DecorativeBlob className="w-80 h-80 bg-secondary top-1/3 -right-40" />
        <DecorativeBlob className="w-64 h-64 bg-accent bottom-20 left-1/4" />
        
        {/* 浮动装饰图标 */}
        <FloatingIcon icon={Plane} className="w-16 h-16 top-32 left-[10%] animate-float text-primary" delay={0} />
        <FloatingIcon icon={Globe} className="w-20 h-20 top-48 right-[15%] animate-float-reverse text-secondary" delay={0.5} />
        <FloatingIcon icon={Compass} className="w-14 h-14 bottom-40 left-[20%] animate-float text-accent" delay={1} />
        <FloatingIcon icon={MapPin} className="w-12 h-12 top-1/3 left-[5%] animate-bounce-gentle text-primary" delay={0.3} />
        <FloatingIcon icon={Camera} className="w-10 h-10 bottom-32 right-[10%] animate-float text-secondary" delay={0.7} />
        <FloatingIcon icon={Mountain} className="w-24 h-24 bottom-20 right-[25%] animate-wave text-muted-foreground" delay={0.2} />
        <FloatingIcon icon={Palmtree} className="w-16 h-16 top-1/4 right-[8%] animate-float-reverse text-accent" delay={1.2} />
        
        {/* 装饰圆环 */}
        <DecorativeRing className="top-20 right-[20%]" size={120} />
        <DecorativeRing className="bottom-32 left-[15%]" size={80} />
        
        <Header />
        
        <main className="flex-1 flex items-center justify-center relative z-10">
          <div 
            className={`text-center space-y-8 p-8 max-w-2xl transition-all duration-700 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* 主图标带动画 */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-glow" />
                <div className="relative glass-card rounded-full p-8 animate-fade-in-scale">
                  <Wallet className="w-20 h-20 text-primary animate-bounce-gentle" />
                </div>
              </div>
            </div>
            
            {/* 标题和描述 */}
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in-up">
                Welcome to Secure Travel Diary
              </h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto animate-fade-in-up animation-delay-200">
                Connect your wallet to start storing and encrypting your travel diary entries with blockchain security.
              </p>
            </div>
            
            {/* 特性展示卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {[
                { icon: Globe, title: 'Global Access', desc: 'Access anywhere' },
                { icon: Compass, title: 'Encrypted', desc: 'FHE protected' },
                { icon: Camera, title: 'Memories', desc: 'Store forever' },
              ].map((item, i) => (
                <div 
                  key={item.title}
                  className={`glass-card rounded-xl p-6 hover-lift animate-fade-in-up`}
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
                  <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            
            {/* 底部装饰线 */}
            <div className="flex items-center justify-center gap-2 pt-4 animate-fade-in-up animation-delay-500">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
              <Plane className="w-4 h-4 text-primary animate-bounce-gentle" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // 已连接钱包时的主页面
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-pattern-grid opacity-50" />
      <DecorativeBlob className="w-[500px] h-[500px] bg-primary/30 -top-64 -right-64" />
      <DecorativeBlob className="w-96 h-96 bg-secondary/20 top-1/2 -left-48" />
      <DecorativeBlob className="w-72 h-72 bg-accent/25 bottom-0 right-1/4" />
      
      {/* 浮动装饰图标 - 已连接状态 */}
      <FloatingIcon icon={Ship} className="w-12 h-12 top-32 left-[5%] animate-wave text-primary" delay={0} />
      <FloatingIcon icon={Sunrise} className="w-14 h-14 top-48 right-[8%] animate-float text-accent" delay={0.4} />
      <FloatingIcon icon={Mountain} className="w-10 h-10 bottom-1/3 left-[8%] animate-float-reverse text-secondary" delay={0.8} />
      <FloatingIcon icon={Palmtree} className="w-16 h-16 bottom-48 right-[5%] animate-float text-primary" delay={1.1} />
      
      {/* 装饰圆环 */}
      <DecorativeRing className="top-40 left-[12%]" size={60} />
      <DecorativeRing className="bottom-60 right-[10%]" size={100} />
      
      <Header />
      
      <main className="flex-1 relative z-10">
        {/* 顶部装饰横幅 */}
        <div className="relative py-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
          <div className="container mx-auto px-4">
            <div className={`flex items-center justify-center gap-4 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}>
              <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-primary/30" />
              <div className="flex items-center gap-3 text-muted-foreground">
                <Plane className="w-5 h-5 text-primary animate-bounce-gentle" />
                <span className="text-sm font-medium">Your Journey Awaits</span>
                <Globe className="w-5 h-5 text-secondary animate-rotate-slow" />
              </div>
              <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-primary/30" />
            </div>
          </div>
        </div>
        
        {/* 主内容区域带动画 */}
        <div className={`transition-all duration-700 delay-100 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <DiaryWriter />
        </div>
        
        <div className={`transition-all duration-700 delay-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <DiaryList />
        </div>
        
        {/* 底部装饰区域 */}
        <div className="py-12 relative">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6 text-muted-foreground/50">
              {[MapPin, Compass, Camera, Mountain, Palmtree].map((Icon, i) => (
                <Icon 
                  key={i} 
                  className={`w-6 h-6 animate-fade-in-up`}
                  style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
