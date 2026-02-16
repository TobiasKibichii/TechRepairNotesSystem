import { Link } from "react-router-dom";

const Public = () => {
  const content = (
    <section className="public">
      <header>
        <h1>
          Welcome to <span className="nowrap">TechFix Hub</span>
        </h1>
      </header>
      <main className="public__main">
        <p>
          Conveniently located in the heart of Nairobi, TechFix Hub offers
          reliable and professional device repair services handled by skilled
          technicians.
        </p>

        <address className="public__addr">
          TechFix Hub
          <br />
          Kimathi Street, 3rd Floor
          <br />
          Nairobi, Kenya
          <br />
          <a href="tel:+254712345678">+254 712 345 678</a>
        </address>

        <br />

        <p>Owner: Tobias Kibichii</p>
      </main>

      <footer>
        <Link to="/login">Employee Login</Link>
      </footer>
    </section>
  );
  return content;
};
export default Public;
