import { ref } from "vue";

const isDarkTheme = ref(true);

export function useTheme() {
  const setTheme = (theme: "dark" | "light") => {
    isDarkTheme.value = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
  };

  const toggleTheme = () => {
    const newTheme = isDarkTheme.value ? "light" : "dark";
    setTheme(newTheme);
    return newTheme;
  };

  return {
    isDarkTheme,
    toggleTheme,
    setTheme,
  };
}
