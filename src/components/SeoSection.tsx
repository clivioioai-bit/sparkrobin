import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Code, Video, Sparkles, Globe, Clock } from "lucide-react";

const SeoSection = () => {
  return (
    <section className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main SEO Content */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
            A Practical <span className="text-primary">Spark Robin Watch & Workflow</span> Hub
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Spark Robin 相关信息还在快速变化。这个站点不再用夸张参数包装模型，
            而是帮助创作者整理提示词、参考图、镜头说明和可复用的 AI 视频工作流。
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Release Watch</h3>
              </div>
                <p className="text-muted-foreground text-sm">
                  跟踪 Spark Robin、Veo 与 Google Cloud 文档中的真实更新，把确认信息和市场传闻区分开，避免 SEO 文案过度承诺。
                </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Code className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Prompt System</h3>
              </div>
                <p className="text-muted-foreground text-sm">
                  把一句话 prompt 拆成主体、镜头、动作、场景、风格和连续性说明，让团队可以复用、比较和持续迭代。
                </p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Reference Workflow</h3>
              </div>
                <p className="text-muted-foreground text-sm">
                  用产品图、视觉样张和品牌资产作为生成依据，让每次视频草稿都有清晰的创意锚点，而不是纯文本碰运气。
                </p>
            </Card>
          </div>
        </div>

        {/* Use Cases & Keywords */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-6">
              为什么需要新的 <span className="text-primary">Spark Robin</span> 文案逻辑？
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                  <Video className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">从“模型宣传”转向“工作流准备”</h4>
                  <p className="text-sm text-muted-foreground">
                    现在最有价值的不是重复旧模型卖点，而是帮助用户准备可迁移的创意资产和提示词结构。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">从“参数堆叠”转向“可信信息”</h4>
                  <p className="text-sm text-muted-foreground">
                    对未确认的 Spark Robin 参数保持克制，把官方确认、合理推测和站内功能分开表达。
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                  <Clock className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">从“一次生成”转向“可复盘迭代”</h4>
                  <p className="text-sm text-muted-foreground">
                    每个草稿都保留创意意图，方便团队比较版本、复用镜头语言，并快速进入下一轮修改。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Perfect for:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "AI 视频 SEO 团队",
                  "内容创作者", 
                  "产品营销团队",
                  "广告创意团队",
                  "电商品牌",
                  "短视频运营",
                  "创意工作室",
                  "模型观察者"
                ].map((useCase) => (
                  <Badge key={useCase} variant="secondary" className="text-xs">
                    {useCase}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Trending Keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "spark-robin",
                  "spark robin ai",
                  "google spark robin",
                  "spark-robin text to video",
                  "spark robin api",
                  "ai video generator",
                  "text to video",
                  "image to video"
                ].map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs border-primary/30">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-card/30 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold mb-2 text-primary">Release-aware SEO</h4>
              <p className="text-sm text-muted-foreground">
                Spark Robin 还没有足够稳定的官方公开参数时，最好的 SEO 不是伪造确定性，而是建立可信、可更新、可操作的内容体系。
              </p>
            </div>
          </div>
        </div>

        {/* Long-tail SEO Content */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-muted/30 rounded-lg p-8">
            <h3 className="text-xl font-bold mb-4 text-center">
              如何准备 Spark Robin AI 视频工作流
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">建立可复用 Prompt 模板</h4>
                <p className="mb-3">
                  先写清楚主体、场景、镜头、运动、光线、节奏和品牌限制。这样无论使用当前工具还是未来模型，都能快速迁移。
                </p>
                <p>
                  对每次生成保留版本说明，记录哪些镜头语言有效、哪些提示词容易导致偏差，逐步形成团队内部标准。
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">用参考资产降低不确定性</h4>
                <p className="mb-3">
                  图片、产品图、分镜图和品牌样张比抽象描述更稳定。把参考资产和 motion notes 组合起来，能让视频草稿更容易评审。
                </p>
                <p>
                  当官方 Spark Robin 信息更新时，这套资产和提示词结构仍然可以复用，不会因为模型名称变化而重做全部内容。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeoSection;
