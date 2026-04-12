import { Fragment } from "react";

const principleRows = [
  ["第一性原理", "独立思考", "质疑一切"],
  ["学习一切", "直面一切"],
  ["拒绝幻想", "拒绝麻木", "拒绝体制化"],
] as const;

const focusAreas = ["ai", "金融", "认知"] as const;

const profileDetails = [
  "06 年",
  "175cm",
  "55 公斤",
  "自然卷长发",
  "蒙古族",
] as const;

export default function AboutIdentityCards() {
  return (
    <div className="about-identity-stack">
      <article className="about-note-card about-note-card-principles">
        <div className="about-principles-flow">
          {principleRows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="about-principles-row">
              {row.map((item, index) => (
                <Fragment key={item}>
                  <span className="about-principle-token">{item}</span>
                  {index < row.length - 1 ? (
                    <span aria-hidden="true" className="about-note-divider" />
                  ) : null}
                </Fragment>
              ))}
            </div>
          ))}
        </div>
      </article>

      <article className="about-note-card about-note-card-focus">
        <p className="about-note-label">
          专注领域
          <span
            aria-hidden="true"
            className="about-note-divider about-note-divider-inline"
          />
        </p>
        <div className="about-focus-line">
          {focusAreas.map((item, index) => (
            <Fragment key={item}>
              <span className="about-focus-chip">{item}</span>
              {index < focusAreas.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="about-note-divider about-note-divider-soft"
                />
              ) : null}
            </Fragment>
          ))}
        </div>
      </article>

      <article className="about-note-card about-note-card-profile">
        <p className="about-note-school">
          天津工业大学
          <span
            aria-hidden="true"
            className="about-note-divider about-note-divider-inline about-note-divider-muted"
          />
          数学系
        </p>
        <div className="about-profile-line">
          {profileDetails.map((item, index) => (
            <Fragment key={item}>
              <span className="about-profile-item">{item}</span>
              {index < profileDetails.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="about-note-divider about-note-divider-muted"
                />
              ) : null}
            </Fragment>
          ))}
        </div>
      </article>
    </div>
  );
}
