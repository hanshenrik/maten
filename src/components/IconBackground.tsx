export const IconBackground = ({
  icon,
  active,
  children,
  className,
}: {
  icon: "home" | "recipes" | "plans" | "shopping" | "settings";
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
}) => {
  const colors = {
    home: "bg-yellow-100",
    recipes: "bg-blue-100",
    plans: "bg-green-100",
    shopping: "bg-red-100",
    settings: "bg-gray-100",
  };
  return (
    <div
      className={`block w-fit rounded-tl-2xl rounded-tr-md rounded-br-xl rounded-bl-lg p-2 ${active ? colors[icon] : ""} ${className}`}
    >
      {children}
    </div>
  );
};
