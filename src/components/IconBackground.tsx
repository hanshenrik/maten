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
  const padding = {
    home: "p-2",
    recipes: "p-2",
    plans: "p-2",
    shopping: "p-2 pr-1",
    settings: "p-2",
  };
  return (
    <div
      className={`block w-fit rounded-tl-2xl rounded-tr-md rounded-br-xl rounded-bl-lg ${active ? colors[icon] : ""} ${padding[icon]} ${className}`}
    >
      {children}
    </div>
  );
};
