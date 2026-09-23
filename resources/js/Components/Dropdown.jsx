import { useState, createContext, useContext } from "react";
import { Link } from "@inertiajs/react";

const DropDownContext = createContext();

export default function Dropdown({ children }) {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => setOpen((previousState) => !previousState);

    return (
        <DropDownContext.Provider value={{ open, setOpen, toggleOpen }}>
            <div className="relative">{children}</div>
        </DropDownContext.Provider>
    );
}

Dropdown.Trigger = function DropdownTrigger({ children }) {
    const { toggleOpen } = useContext(DropDownContext);
    return <div onClick={toggleOpen}>{children}</div>;
};

Dropdown.Content = function DropdownContent({ children }) {
    const { open } = useContext(DropDownContext);
    return (
        <div className={"absolute z-50 mt-2 rounded-md shadow-lg " + (open ? "" : "hidden")}>
            <div className="rounded-md ring-1 ring-black ring-opacity-5 py-1 bg-white">{children}</div>
        </div>
    );
};

Dropdown.Link = function DropdownLink({ children, ...props }) {
    return (
        <Link
            {...props}
            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none transition duration-150 ease-in-out"
        >
            {children}
        </Link>
    );
};