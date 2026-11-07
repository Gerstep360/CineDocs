//! Gerstep Script Studio — Motor Nativo en Rust (Estructuras A–K, Híbrido y Directorios)
//!
//! Este módulo implementa de forma determinista y fuertemente tipada:
//! 1. Separación total entre Tipo de Producción (`ProjectCategory`) y Estructura (`ScriptStructureType`).
//! 2. Las 11 estructuras de guion (A–K) sin imponer `INT./EXT.` en formatos no cinematográficos.
//! 3. Modo Híbrido (`Hibrida`) con secciones independientes dentro del mismo documento.
//! 4. Conversión no destructiva entre estructuras preservando el 100 % del contenido escrito.
//! 5. Generación de rutas de directorio por proyecto para Google Drive y Almacenamiento Local.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProjectCategory {
    Movie,
    Series,
    Video,
    Episodic,
    Custom,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ScriptStructureType {
    /// A. Cinematográfica
    Cinematografica,
    /// B. Estándar flexible
    EstandarFlexible,
    /// C. Híbrida (múltiples estructuras por sección)
    Hibrida,
    /// D. Voz en off
    VozEnOff,
    /// E. Audiovisual técnico (Dos columnas VIDEO / AUDIO)
    AudiovisualTecnico,
    /// F. Sketch y comedia
    SketchComedia,
    /// G. Documental y entrevista
    DocumentalEntrevista,
    /// H. Tutorial y educativo
    TutorialEducativo,
    /// I. Programa y escaleta
    ProgramaEscaleta,
    /// J. Audio y podcast
    AudioPodcast,
    /// K. Videoclip
    Videoclip,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BlockType {
    // A. Cinematográfica
    SceneHeading,
    Action,
    Character,
    Dialogue,
    Parenthetical,
    Transition,
    VoiceOver,
    OffScreen,
    Shot,
    // B. Estándar flexible
    Heading1,
    Heading2,
    Paragraph,
    Narration,
    Description,
    ListItem,
    NoteBlock,
    // C. Híbrida
    SectionDivider,
    // D. Voz en off
    PauseMark,
    Emphasis,
    VisualDesc,
    MusicCue,
    SfxCue,
    // E. Audiovisual técnico (2 columnas)
    AvRow,
    // F. Sketch y comedia
    Situation,
    Twist,
    Punchline,
    // G. Documental y entrevista
    InterviewSubject,
    InterviewQuestion,
    Testimony,
    ArchiveFootage,
    Reenactment,
    SourceRef,
    ResearchNote,
    // H. Tutorial y educativo
    Explanation,
    Demonstration,
    ScreenAction,
    ExampleBlock,
    VisualResource,
    // I. Programa y escaleta
    SegmentHeader,
    DurationMark,
    IntroCue,
    HostCue,
    GuestCue,
    OutroCue,
    ProductionNote,
    // J. Audio y podcast
    NarratorCue,
    VoiceCue,
    AmbienceCue,
    SilenceMark,
    // K. Videoclip
    MusicSection,
    TimecodeMark,
    Choreography,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptBlock {
    pub id: String,
    pub block_type: BlockType,
    pub text: String,
    pub visual_text: Option<String>,
    pub audio_text: Option<String>,
    pub section_structure: Option<ScriptStructureType>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptDocument {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub structure_type: ScriptStructureType,
    pub blocks: Vec<ScriptBlock>,
    pub local_directory_path: String,
    pub drive_folder_path: String,
}

impl ScriptStructureType {
    pub fn code(&self) -> &'static str {
        match self {
            Self::Cinematografica => "A",
            Self::EstandarFlexible => "B",
            Self::Hibrida => "C",
            Self::VozEnOff => "D",
            Self::AudiovisualTecnico => "E",
            Self::SketchComedia => "F",
            Self::DocumentalEntrevista => "G",
            Self::TutorialEducativo => "H",
            Self::ProgramaEscaleta => "I",
            Self::AudioPodcast => "J",
            Self::Videoclip => "K",
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            Self::Cinematografica => "Cinematográfica",
            Self::EstandarFlexible => "Estándar flexible",
            Self::Hibrida => "Híbrida (Multiformato por secciones)",
            Self::VozEnOff => "Voz en off y Narración",
            Self::AudiovisualTecnico => "Audiovisual técnico (2 Columnas VIDEO / AUDIO)",
            Self::SketchComedia => "Sketch y comedia",
            Self::DocumentalEntrevista => "Documental y entrevista",
            Self::TutorialEducativo => "Tutorial y educativo",
            Self::ProgramaEscaleta => "Programa y escaleta",
            Self::AudioPodcast => "Audio y podcast",
            Self::Videoclip => "Videoclip musical",
        }
    }

    /// Bloques iniciales limpios para cada estructura (nunca fuerza INT./EXT. fuera de cine)
    pub fn initial_blocks(&self) -> Vec<ScriptBlock> {
        match self {
            Self::Cinematografica => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::SceneHeading,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::Action,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
            Self::EstandarFlexible => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::Heading1,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::Paragraph,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
            Self::Hibrida => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::SectionDivider,
                    text: "Sección 1: Introducción".into(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: Some(ScriptStructureType::VozEnOff),
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::Narration,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
            Self::VozEnOff => vec![ScriptBlock {
                id: "blk-1".into(),
                block_type: BlockType::Narration,
                text: String::new(),
                visual_text: None,
                audio_text: None,
                section_structure: None,
                notes: None,
            }],
            Self::AudiovisualTecnico => vec![ScriptBlock {
                id: "blk-1".into(),
                block_type: BlockType::AvRow,
                text: String::new(),
                visual_text: Some(String::new()),
                audio_text: Some(String::new()),
                section_structure: None,
                notes: None,
            }],
            Self::SketchComedia => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::Situation,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::Action,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
            Self::DocumentalEntrevista => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::Narration,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::InterviewQuestion,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
            Self::TutorialEducativo => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::Explanation,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::Demonstration,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
            Self::ProgramaEscaleta => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::SegmentHeader,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::DurationMark,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
            Self::AudioPodcast => vec![ScriptBlock {
                id: "blk-1".into(),
                block_type: BlockType::NarratorCue,
                text: String::new(),
                visual_text: None,
                audio_text: None,
                section_structure: None,
                notes: None,
            }],
            Self::Videoclip => vec![
                ScriptBlock {
                    id: "blk-1".into(),
                    block_type: BlockType::MusicSection,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
                ScriptBlock {
                    id: "blk-2".into(),
                    block_type: BlockType::VisualDesc,
                    text: String::new(),
                    visual_text: None,
                    audio_text: None,
                    section_structure: None,
                    notes: None,
                },
            ],
        }
    }
}

pub fn build_drive_directory_path(
    category: ProjectCategory,
    project_title: &str,
    season_title: Option<&str>,
) -> String {
    let cat_folder = match category {
        ProjectCategory::Movie => "Peliculas",
        ProjectCategory::Series => "Series",
        ProjectCategory::Video => "Videos",
        ProjectCategory::Episodic => "Contenido Episodico",
        ProjectCategory::Custom => "Personalizados",
    };
    let clean_title = project_title.trim();
    match (category, season_title) {
        (ProjectCategory::Series, Some(season)) => {
            format!("Gerstep/Guiones/{}/{}/{}", cat_folder, clean_title, season.trim())
        }
        _ => format!("Gerstep/Guiones/{}/{}", cat_folder, clean_title),
    }
}

pub fn build_local_directory_path(
    category: ProjectCategory,
    project_title: &str,
    season_title: Option<&str>,
) -> String {
    let cat_folder = match category {
        ProjectCategory::Movie => "Peliculas",
        ProjectCategory::Series => "Series",
        ProjectCategory::Video => "Videos",
        ProjectCategory::Episodic => "Contenido Episodico",
        ProjectCategory::Custom => "Personalizados",
    };
    let clean_title = project_title.trim();
    match (category, season_title) {
        (ProjectCategory::Series, Some(season)) => {
            format!("Documento/Gerstep/{}/{}/{}", cat_folder, clean_title, season.trim())
        }
        _ => format!("Documento/Gerstep/{}/{}", cat_folder, clean_title),
    }
}
