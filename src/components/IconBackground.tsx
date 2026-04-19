export const IconBackground = ({
  icon,
  isSelected,
  children,
  className,
}: {
  icon: "home" | "recipes" | "plans" | "shopping" | "settings";
  isSelected?: boolean;
  children?: React.ReactNode;
  className?: string;
}) => {
  const selectedColors = {
    home: "bg-yellow-300",
    recipes: "bg-blue-300",
    plans: "bg-green-300",
    shopping: "bg-red-300",
    settings: "bg-gray-300",
  };
  const hoverColors = {
    home: "group-hover:bg-yellow-100 group-active:bg-yellow-200",
    recipes: "group-hover:bg-blue-100 group-active:bg-blue-200",
    plans: "group-hover:bg-green-100 group-active:bg-green-200",
    shopping: "group-hover:bg-red-100 group-active:bg-red-200",
    settings: "group-hover:bg-gray-100 group-active:bg-gray-200",
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
      className={`block w-fit rounded-tl-2xl rounded-tr-md rounded-br-xl rounded-bl-lg transition-colors ${isSelected ? selectedColors[icon] : ""} ${padding[icon]} ${hoverColors[icon]} ${className}`}
    >
      {children}
    </div>
  );
};
