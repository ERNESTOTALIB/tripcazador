"use client";

/**
 * PanelLogoutButton — fase tt-TT3
 *
 * Refactor: el botón de logout estaba dentro de un <form action="...">
 * con onClick + preventDefault. Esto causaba problemas de hydration en
 * Next 14 RSC cuando el server component crashea — la pantalla quedaba
 * en blanco porque el árbol React no podía hidratarse.
 *
 * Solución: client component limpio sin form wrapper. Botón hace fetch
 * directo y redirige.
 */

export function PanelLogoutButton() {
  const handleClick = () => {
    fetch("/api/panel/logout", { method: "POST", credentials: "same-origin" })
      .catch(() => {
        // ignore — redirigimos igualmente
      })
      .finally(() => {
        window.location.href = "/panel/login";
      });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-red-400 hover:text-red-300 underline-offset-2 hover:underline"
    >
      Cerrar sesión
    </button>
  );
}
