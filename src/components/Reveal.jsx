export default function Reveal({
  as: Component = "div",
  children,
  className = "",
  delay,
  amount,
  ...rest
}) {
  return (
    <Component className={className} {...rest}>
      {children}
    </Component>
  );
}
