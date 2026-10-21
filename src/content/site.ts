type Company = {
  companyName: string;
  contactEmail: string | null;
  phoneDisplay: string | null;
  phoneE164: string | null;
  whatsappNumber: string | null;
  address: string | null;
  serviceArea: string | null;
  clientPortalUrl: string | null;
  socialLinks: { label: string; url: string }[];
  siteUrl: string | null;
};
export const company: Company = {
  companyName: "Lemos Morales",
  contactEmail: "lemosmoralesadministracion@gmail.com",
  phoneDisplay: "+54 9 351 515-4142",
  phoneE164: "+5493515154142",
  whatsappNumber: "5493515154142",
  address: null,
  serviceArea: null,
  clientPortalUrl: null,
  socialLinks: [],
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
};
export const navigation = [
  { label: "Nosotros", href: "#nosotros" },
  { label: "Gestión", href: "#gestion" },
  { label: "Cómo trabajamos", href: "#como-trabajamos" },
  { label: "Contacto", href: "#contacto" },
];
export const content = {
  hero: {
    eyebrow: "Administración de consorcios",
    title: "Una administración presente.",
    emphasis: "Un consorcio tranquilo.",
    description:
      "En Lemos Morales acompañamos el día a día de tu consorcio con una gestión profesional, herramientas que aportan transparencia y un área legal integrada.",
  },
  management: {
    title: "Administrar también es estar.",
    description:
      "Cada consorcio necesita una gestión que escuche, acompañe y se ocupe de lo que pasa todos los días.",
    items: [
      [
        "Gestión profesional",
        "Acompañamos la administración cotidiana del consorcio con organización, responsabilidad y atención a cada situación.",
      ],
      [
        "Transparencia y tecnología",
        "Trabajamos con herramientas tecnológicas que aportan claridad y facilitan el seguimiento de la gestión.",
      ],
      [
        "Comunicación y seguimiento",
        "Escuchamos las consultas, acompañamos su evolución y trabajamos para encontrar soluciones concretas.",
      ],
      [
        "Área legal integrada",
        "Integramos la mirada legal a nuestra metodología de trabajo y a las situaciones que requieren ese acompañamiento.",
      ],
    ],
  },
  about: {
    title: "Profesionales en la gestión. Cercanos en el día a día.",
    paragraphs: [
      "Somos una empresa especializada en la administración de consorcios de propiedad horizontal, orientada a brindar una gestión profesional, transparente y eficiente.",
      "Entendemos la administración como mucho más que una tarea contable o administrativa. Acompañamos a los propietarios y al consorcio, procurando que cada situación sea atendida con rapidez, responsabilidad y soluciones concretas.",
    ],
    premise:
      "Administrar con transparencia, responder con rapidez y resolver con responsabilidad.",
  },
  process: {
    title: "Comunicación, seguimiento y soluciones.",
    steps: [
      [
        "Escuchamos",
        "Entendemos la situación y las necesidades del consorcio.",
      ],
      [
        "Nos ocupamos",
        "Evaluamos cada tema y coordinamos las acciones necesarias.",
      ],
      [
        "Damos seguimiento",
        "Acompañamos la evolución de cada situación con comunicación y responsabilidad.",
      ],
    ],
  },
  support: {
    title: "Más claridad para decidir. Más respaldo para gestionar.",
    description:
      "Combinamos herramientas tecnológicas y un área legal integrada para acompañar una gestión profesional, transparente y responsable.",
  },
  property: {
    title: "Una mirada integral sobre las propiedades.",
    description:
      "También desarrollamos actividades en el rubro inmobiliario, complementando nuestra experiencia en administración y gestión de propiedades.",
  },
  faq: [
    [
      "¿Qué tipo de consorcios administran?",
      "Nos especializamos en consorcios de propiedad horizontal. Contanos las características de tu edificio para conversar sobre sus necesidades.",
    ],
    [
      "¿Cómo puedo solicitar una propuesta?",
      "Dejanos tus datos y una breve descripción del consorcio a través del formulario de contacto.",
    ],
    [
      "¿Cuentan con un área legal?",
      "Sí. Lemos Morales cuenta con un área legal integrada a su metodología de trabajo.",
    ],
    [
      "¿También trabajan en el rubro inmobiliario?",
      "Sí. Además de la administración de consorcios, desarrollamos actividades vinculadas con la gestión de propiedades.",
    ],
  ],
  contact: {
    title: "Hablemos de tu consorcio.",
    description:
      "Contanos qué necesita tu edificio y conversemos sobre cómo podemos acompañarlos.",
  },
};
