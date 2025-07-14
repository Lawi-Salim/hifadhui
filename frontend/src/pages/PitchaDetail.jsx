import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

const PitchaDetail = () => {
  const { id } = useParams();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        const data = await api.getPhoto(id);
        setPhoto(data);
      } catch {
        setPhoto(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPhoto();
  }, [id]);

  if (loading) return <div style={{ textAlign: "center", marginTop: 40 }}>Chargement...</div>;
  if (!photo) return <div style={{ textAlign: "center", marginTop: 40 }}>Photo non trouvée</div>;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#111",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{ maxWidth: 600, width: "100%", background: "#181c24", borderRadius: 12, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.2)" }}>
        <img src={photo.filepath} alt={photo.title} style={{ width: "100%", borderRadius: 8, marginBottom: 24 }} />
        <h1 style={{ marginBottom: 8 }}>{photo.title}</h1>
        <div style={{ marginBottom: 8 }}>{photo.description}</div>
        <div style={{ fontSize: 14, color: "#aaa" }}>Ajoutée le {new Date(photo.upload_date).toLocaleString("fr-FR")}</div>
      </div>
    </div>
  );
};

export default PitchaDetail; 