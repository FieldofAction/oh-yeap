const listStyle = { listStyle: "none", margin: 0, padding: 0 };

// The parent and its instruments travel together, independent of nav tiers.
// Native hrefs preserve copying links and opening them in another tab.
export default function RelationalDesignNav({ view, onNavigate }) {
  const follow = (event, key) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate({ key });
  };

  return (
    <nav aria-label="Relational Design">
      <ul style={listStyle}>
        <li>
          <a
            className={`sb-link${view === "canon" || view === "materials" ? " on" : ""}`}
            href="#relational-design"
            aria-current={view === "canon" ? "page" : undefined}
            onClick={(event) => follow(event, "canon")}
          >Relational Design</a>
          <ul style={listStyle} aria-label="Relational Design instruments">
            <li>
              <a
                className={`sb-link${view === "materials" ? " on" : ""}`}
                style={{ paddingLeft: 36 }}
                href="#materials-in-relation"
                aria-current={view === "materials" ? "page" : undefined}
                onClick={(event) => follow(event, "materials")}
              >Materials in Relation</a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
