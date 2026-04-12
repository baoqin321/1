import { Fragment } from "react";

const introText =
  "\u4e00\u4e2a\u957f\u671f\u66f4\u65b0\u7684\u4e2a\u4eba\u7a7a\u95f4\uff0c\u7528\u6765\u8868\u8fbe\u89c1\u89e3\uff0c\u5206\u4eab\u4e00\u5207\u81ea\u8ba4\u4e3a\u6709\u4ef7\u503c\u7684\u4fe1\u606f\uff0c\u4ee5\u53ca\u6211\u81ea\u5df1\u7684\u4e00\u4e9b\u4f5c\u54c1\u3002";

const cognitionSegments = [
  "\u81ea\u5df1\u7684\u539f\u59cb\u672c\u6027\uff0c\u56fa\u5316\u7684\u8ba4\u77e5",
  "\u624d\u662f\u6700\u5927\u7684\u7262\u7b3c",
  "\u5176\u6b21\u624d\u662f\u5916\u754c\u6761\u4ef6",
] as const;

const processSteps = [
  { zh: "\u89c2\u5bdf", en: "Observation" },
  { zh: "\u7b56\u7565", en: "Strategy" },
  { zh: "\u51b3\u7b56", en: "Decision" },
  { zh: "\u884c\u52a8", en: "Execution" },
  { zh: "\u590d\u76d8", en: "Learning" },
] as const;

export default function AboutRightCards() {
  return (
    <div className="about-side-notes">
      <article className="about-side-card about-side-card-intro">
        <p className="about-side-copy">{introText}</p>
      </article>

      <article className="about-side-card about-side-card-cognition">
        <div className="about-side-quote-wrap">
          <p className="about-side-quote about-side-quote-lead">
            {cognitionSegments[0]}
          </p>
          <p className="about-side-quote about-side-quote-core">
            {cognitionSegments[1]}
          </p>
          <p className="about-side-quote about-side-quote-tail">
            {cognitionSegments[2]}
          </p>
        </div>
      </article>

      <article className="about-side-card about-side-card-process">
        <div className="about-process-flow">
          {processSteps.map((step, index) => (
            <Fragment key={step.en}>
              <div className="about-process-step">
                <span className="about-process-pill">
                  <span className="about-process-zh">{step.zh}</span>
                  <span className="about-process-en">{step.en}</span>
                </span>
              </div>
              {index < processSteps.length - 1 ? (
                <div aria-hidden="true" className="about-process-connector">
                  <span className="about-process-arrow" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </article>
    </div>
  );
}
