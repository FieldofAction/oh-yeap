import { useEffect } from 'react';
import MaterialsInRelation from '../MaterialsInRelation';

export default function MaterialsDetail() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Materials in Relation — Field of Action';
    return () => { document.title = previousTitle; };
  }, []);

  return <article className="mir-page">
    <nav className="mir-breadcrumb" aria-label="Back to the Canon">
      <a href="#relational-design">← Relational Design</a>
      <span aria-hidden="true">/</span>
      <span>Instrument</span>
    </nav>
    <MaterialsInRelation />
  </article>;
}
