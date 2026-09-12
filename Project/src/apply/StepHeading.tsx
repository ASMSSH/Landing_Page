interface StepHeadingProps {
  number: number;
  title: string;
  description: string;
}

export default function StepHeading({ number, title, description }: StepHeadingProps) {
  return (
    <div className="apply-step-heading">
      <div className="apply-step-heading-row">
        <span className="apply-step-circle active">{number}</span>
        <h2 className="apply-step-title">{title}</h2>
      </div>
      <p className="apply-step-desc">{description}</p>
    </div>
  );
}
