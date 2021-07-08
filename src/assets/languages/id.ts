import { LocaleMessages } from "vue-i18n";

export default {
  account: {
    createError: "Pembuatan akun baru tidak berhasil: {error}",
    emailNotVerified: "Akun anda belum diverifikasi. Periksalah email anda",
    emailVerification:
      "Email untuk verifikasi akun telah dikirim ke {emailAddr}",
    loginError: "Login tidak berhasil: {error}",
    passwordReset: "Periksalah email and ({emailAddr}) untuk mereset password"
  },
  buttons: {
    CreateAngleDisplayedName: "Sudut",
    CreateAngleToolTipMessage: "Hitung Sudut",
    CreateAngleToolUseMessage:
      "Gunakan tombol ini untuk menghitung sudut antara dua garis atau 3 titik.",
    CreateAntipodalPointDisplayedName: "Titik Antipodal",
    CreateAntipodalPointToolTipMessage: "Pilih titik",
    CreateAntipodalPointToolUseMessage:
      "Pilih salah satu titik untuk menciptakan titik pasangan antipodal",
    CreateCircleDisplayedName: "Lingkaran",
    CreateCircleToolTipMessage: "Tambahkan lingkaran",
    CreateCircleToolUseMessage:
      "Tekan dan geser untuk tambahkan lingkaran dengan titik pusat dan titik luar.",
    CreateCoordinateDisplayedName: "Coordinates<br>&nbsp;",
    CreateCoordinateToolTipMessage: "Measure x,y,z coordinates",
    CreateCoordinateToolUseMessage:
      "Select a point to measure its x,y,z coordinates on the sphere",
    CreateIntersectionDisplayedName: "Titik potong",
    CreateIntersectionToolTipMessage: "Tentukan titik potong dua objek",
    CreateIntersectionToolUseMessage:
      "Pilih dua objek satu dimensi untuk menentukan titik potongnya",
    CreateLineDisplayedName: "Garis",
    CreateLineSegmentDisplayedName: "Segmen Garis",
    CreateLineSegmentToolTipMessage: "Tambahkan segmen garis",
    CreateLineSegmentToolUseMessage:
      "Tekan dan geser mouse umtuk tambahkan segmen garis melewati dua titik.",
    CreateLineToolTipMessage: "Tambahkan garis",
    CreateLineToolUseMessage:
      "Tekan dan geser mouse untuk tambahkan garis melewati dua titik.",
    CreatePerpendicularDisplayedName: "Perpendicular<br>&nbsp;",
    CreatePerpendicularToolTipMessage: "Perpendicular Through Point",
    CreatePerpendicularToolUseMessage:
      "Create a perpendicular line to a selected one-dimensional object and selected location.",
    CreatePointDisplayedName: "Titik",
    CreatePointDistanceDisplayedName: "Jarak Dua Titik",
    CreatePointDistanceToolTipMessage: "Jarak Dua Titik",
    CreatePointDistanceToolUseMessage:
      "Pilih dua titik dan tentukan jarak antara keduanya",
    CreatePointOnOneDimDisplayedName: "Titik pada Objek Satu Dimensi",
    CreatePointOnOneDimToolTipMessage:
      "Pilih objek satu dimensi untuk penempatan titik",
    CreatePointOnOneDimToolUseMessage:
      "Pilih objek satu dimensi untuk penempatan titik",
    CreatePointToolTipMessage: "Tambahkan titik",
    CreatePointToolUseMessage: "Tekan mouse untuk tambahkan titik bebas.",
    CreateSegmentLengthDisplayedName: "Panjang Segment Garis",
    CreateSegmentLengthToolTipMessage: "Panjang Segment Garis",
    CreateSegmentLengthToolUseMessage:
      "Gunakan tombol ini untuk menentukan panjang segmen garis",
    CreateSliderDisplayedName: "Variable Bebas",
    CreateSliderToolTipMessage: "Variable Bebas",
    CreateSliderToolUseMessage:
      "Tekan tombol ini untuk menambahkan variable bebas",
    CurrentTool: "Current Tool",
    DeleteDisplayedName: "Hapus",
    DeleteToolTipMessage: "Hapus objek",
    DeleteToolUseMessage: "Pilih objek untuk dihapus",
    HideDisplayedName: "Sembunyikan",
    HideObjectToolTipMessage: "Sembunyikan objek",
    HideObjectToolUseMessage: "Pilih objek untuk disembunyikan",
    MoveDisplayedName: "Geser",
    MoveObjectToolTipMessage: "Geser Objek",
    MoveObjectToolUseMessage:
      "Tekan dan geser tetikus untuk pindahkan objek (label, titik bebas, garis, titik antipodal. Gunakan tombol SHIFT untuk menggeser objek disisi belakang bola.",
    NoToolSelected: "Pilihan perkakas nihil",
    PanZoomInDisplayedName: "Geser/Perbesar",
    PanZoomInToolTipMessage: "Geser/Perbesar Gambar",
    PanZoomInToolUseMessage:
      "Tekan tetikus untuk memperbesar gambar bermula dari lokasi tetikus. Teken dan geser untuk menggeser gambar.",
    PanZoomOutDisplayedName: "Geser/Perkecil",
    PanZoomOutToolTipMessage: "Geser/Perkecil Gambar",
    PanZoomOutToolUseMessage:
      "Tekan tetikus untuk memperkecil gambar bermula dari lokasi tetikus. Teken dan geser untuk menggeser gambar.",
    RotateDisplayedName: "Putar<br> Bola",
    RotateSphereToolTipMessage: "Putar Bola",
    RotateSphereToolUseMessage: "Tekan dan geser tetikus untuk memutar bola.",
    SelectDisplayedName: "Pilih",
    SelectToolTipMessage: "Pilih Objek",
    SelectToolUseMessage: "Tekan object untuk menyertakan ke dalam pilihan",
    ToggleLabelDisplayedName: "Tampilkan/Sembunyikan Label",
    ToggleLabelToolTipMessage: "Tampilkan/Sembunyikan Label",
    ToggleLabelToolUseMessage:
      "Tekan salah satu objek untuk mengganti tampilan labelnya",
    ZoomFitDisplayedName: "Tampilkan Bola Seutuhnya",
    ZoomFitToolTipMessage: "Tampilkan Bola Seutuhnya",
    ZoomFitToolUseMessage: "Tekan tombol ini untuk menampilkan bola seutuhnya"
  },
  handlers: {
    antipodalPointMessage:
      "Titik yang dipilih adalah antipodal atau titik yang sama dengan titik pertama. Pilih titik yang lain",
    antipodalPointMessage2:
      "Titik yang dipilah antipodal atau identik dengan titik kedua yang dipilih. Pilih yang lain.",
    antipodeDuplicate:
      "Titik antipode dari titik yang dipilih sudah ada sebelumnya.",
    duplicateLineMessage: "Garis duplikat. Pilih yang lain",
    duplicatePointMessage: "Titik duuplikat. Pilih yang lain.",
    duplicateSegmentMessage: "Segmen duplikat. Pilih yang lain",
    intersectionOneDimensionalAlreadyExists:
      "Titik potong sudah ada sebelumnya",
    intersectionOneDimensionalDuplicate: "Objek duplikat. Pilih yang lain",
    intersectionOneDimensionalNotIntersect:
      "Object yang dipilih tidak berpotongan.",
    intersectionOneDimensionalPointCreated:
      "Titik perpotongan berhasil diciptakan.",
    intersectionOneDimensionalSelected:
      "Objek satu dimensi {name} dipilih. Pilih objek berikutnya",
    lineDoesNotContainEndpointOfSegment:
      "Garis yang dipilih melewati titik pada segment yang dipilih sebelumnya. Pilih yang lain",
    moveHandlerNothingSelected: "Tidak ada object dipilih. Perputaran bola",
    newAngleAdded: "Ukuran sudut diciptakan",
    newAngleAddedV2: "Ukuran sudut {name} diciptakan",
    newCoordinatePointMeasurementAdded: "Pengukuran koordinat diciptakan",
    newMeasurementAdded: "Pengukuran baru {name} diciptakan",
    newSegmentMeasurementAdded: "Pengukuran segment {name} diciptakan",
    panZoomHandlerZoomInLimitReached: "Batas zoom in sudah maksimal",
    panZoomHandlerZoomOutLimitReached: "Batas zoom out sudah maksimal",
    perpendicularLineThruPointCircleSelected:
      "Lingkaran {name} dipilih. Pilih lokasi untuk titik baru (titik bebas atau titik pada object)",
    perpendicularLineThruPointLineSelected:
      "Garis {name} dipilih. Pilih lokasi untuk titik baru (titik bebas atau titik pada object)",
    perpendicularLineThruPointPointSelected:
      "Titik dipilih. Pilih lokasi untuk titik baru (titik bebas atau titik pada object)",
    perpendicularLineThruPointSegmentSelected:
      "Segmen {name} dipilih. Pilih lokasi untuk titik baru (titik bebas atau titik pada object)",
    pointCreationAttemptDuplicate: "Sudah ada titik pada lokasi ini",
    segmentWithOutEndpointOnLine:
      "Segmen yang dipiliih tidak melewati titik pada garis yang dipilih sebelumnya. Pilih yang lain",
    segmentsWithOutCommonEndpoint:
      "Segmen yang dipilih tidak memiliki titik yang sama dengan yang dipilih sebelumnya. Pilih yang lain",
    segmentsWithOutEndpointOnLine:
      "Segmen yang dipilih tidak memiliki titik ujung pada garis yang dipilih sebelumnya. Pilih yang lain",
    selectAnotherLine: "Pilih satu garus lagi",
    selectAnotherLineOrSegment: "Pilih satu garus atau segment",
    selectAnotherPoint: "Pilih titik berikutnya",
    selectMorePoints: "Pilih {needed} titik lagi",
    selectionUpdate:
      "Pembaruan pilihan: {number} objek dipilih. Tekan tombol Alt/Option untuk menambah/mengurani pilihan",
    selectionUpdateNothingSelected: "Tidak ada object yang dipiliah"
  },
  main: {
    ConstructionsTabToolTip: "Pustaka Konstruksi",
    ObjectsTabToolTip: "Objek",
    RedoLastAction: "Ulang Aksi Terakhir",
    SphericalEaselMainTitle: "Spherical Easel",
    ToolsTabToolTip: "Alat",
    UndoLastAction: "Batalkan Aksi Terakhir"
  },
  objectTree: {
    calculationExpression: "Calculation Expression",
    create: "Create",
    expression: "Ekspresi",
    firestoreConstructionDeleted: "Konstruksi {docId} dihapus Firestore",
    firestoreConstructionLoaded: "Konstrksi {docId} dimuat dari Firestore",
    firestoreConstructionSaved: "Konstruksi disimpan ke Firestore {docId}",
    firestoreLoadError: "Gagal memuat data {docId} dari Firestore",
    firestoreSaveError: "Gagal menyimpan data ke Firestore",
    max: "Maks",
    min: "Min",
    multipleOfPiToggle: "Hasil kalkulasi ditampilkan sebagai kelipatan \u03c0",
    noObjectsInDatabase: "Database kosong",
    parserError: "Ekspresi tidak lengkap",
    result: "Hasil",
    slider: "Tombol Geser",
    step: "Step",
    toggleDisplay: "Toggle penampilan object"
  },
  objects: {
    circles: "Lingkaran",
    lines: "Garis",
    measurements: "Pengukuran",
    points: "Titik",
    segments: "Segmen Garis"
  },
  settings: {
    title: "Setelan"
  },
  style: {
    DIFFERINGSTYLESDETECTED: "Gaya tampilan",
    advancedStyle: "",
    advancedstyle: "Gaya Tampilan Lanjut",
    back: "Latar Belakang",
    backStyleContrast: "Kontras Latar Belakang",
    backStyleContrastToolTip:
      "Gaya tampilan latar belakang ditentukan oleh gaya tampilan latar muka dan besarnya nilai Kontras Latar Belakang. Nilai kontras 1 menyatakan tidak ada perbedaan warna antara latar muka dan latar belakang. Dengan nilai kontras 0 objek akan tampak hampir hilang",
    backStyleDisagreement: "",
    backgroundStyle: "Gaya Tampilan Latar Belakang",
    basicStyle: "Basic Style",
    bold: "Bold",
    clearChanges: "Batalkan perubahan",
    clearChangesToolTip: "Tekan tombol ini untuk kembali ke tampilan semula",
    clickToMakeLabelsVisible: "",
    clickToMakeObjectsVisible: "",
    closeOrSelect: "",
    closeStylingPanel: "",
    convertSelectionToLabels: "",
    cursive: "Cursive",
    dashPattern: "Pola garis putus",
    dashPatternCheckBoxToolTip: "",
    differentValues: "",
    differentValuesToolTip: "",
    differingStylesDetected: "Gaya tampilah tidak sepadan",
    differingStylesDetectedToolTip:
      "Object yang dipilih memiliki gaya tampilah yang tidak sepadan. Gunakan tombol ini untuk menyamakan gaya tampilah",
    disableBackStyleContrastSlider:
      "Matikan gaya tampil latar belakang untuk objek terpilih",
    disableBackStyleContrastSliderToolTip:
      "Objek yang dipilih disetel unruk latar belakang dinamis. Tekan tombol ini tuntuk mematikan fitur ini",
    disableDashPatternSlider: "Hilangkan Pola Garis Putus",
    disableDashPatternSliderToolTip:
      "Gunakan tombol ini untuk menghilangkan pola garis putus",
    disableDynamicBackStyle: "",
    disableDynamicBackStyleToolTip: "",
    dynamicBackStyle: "Latar Belakang disetel secara dinamis",
    dynamicBackStyleHeader: "",
    editMultipleBasicPropertiesMessage:
      "To edit multiple labels simultaneously select the labels directly.",
    enableBackStyleContrastSlider:
      "Aktifkan gaya tampil latar belakang untuk objek terpilih",
    enableBackStyleContrastSliderToolTip:
      "Objek yang dipilih tidak disetel dengan latar belakang dinamis. Tekan tombol ini tuntuk aktifkan gaya tampil latar belakang dinamis untuk objek terpilih",
    enableCommonStyle: "",
    enableDashPatternSlider: "Aktifkan Pola Garis Putus",
    enableDashPatternSliderToolTip:
      "Object terpilih tidak memiliki pola garis putus. Gunakan tombol ini untuk menyetel pola garis putus",
    enableDynamicBackStyle: "",
    fantasy: "Fantasy",
    fillColor: "Warna pengisi",
    foregroundStyle: "Gaya tampilan latar muka",
    front: "Latar Muka",
    genericSanSerif: "Sans-Serif Font",
    genericSerif: "Serif Font",
    italic: "Italic",
    labelBackFillColor: "",
    labelCaption: "Label Caption",
    labelDisplayCaption: "Label Caption",
    labelDisplayMode: "Label Display Mode",
    labelDisplayModes: {
      LABELISSUE: "",
      NOSELECTION: "",
      OBJECTISSUE: "",
      captionOnly: "Caption Only",
      labelDisplayText: "",
      labelFrontFillColor: "",
      labelHidden: "",
      labelNotVisible: "",
      labelObjectVisibility: "",
      labelStyle: "",
      labelStyleOptions: "",
      labelStyleOptionsMultiple: "",
      labelText: "",
      labelTextDecoration: "",
      labelTextFamily: "",
      labelTextRotation: "",
      labelTextScalePercent: "",
      labelTextStyle: "",
      labelVisible: "",
      labelsNotShowingToolTip: "",
      lessStyleOptions: "",
      makeLabelsVisible: "",
      makeObjectsVisible: "",
      maxMinLabelDisplayCaptionLengthWarning: "",
      maxMinLabelDisplayTextLengthWarning: "",
      monospace: "",
      moreStyleOptions: "",
      moreThanOneItemSelected: "",
      moreThanOneItemSelectedToolTip: "",
      nameAndCaption: "Name and Caption",
      nameAndValue: "",
      nameOnly: "Name Only",
      noFill: "",
      noFillLabelTip: "",
      noSelectionToolTip: "",
      noStroke: "",
      none: "",
      normal: "",
      objectHidden: "",
      objectNotVisible: "",
      objectVisible: "",
      objectsNotShowingToolTip: "",
      opacity: "",
      overline: "",
      pointRadiusPercent: "",
      renameLabels: "",
      restoreDefaults: "",
      restoreDefaultsToolTip: "",
      selectAnObject: "",
      selectObjectsToHide: "",
      selectObjectsToShow: "",
      selectionDirection1: "",
      selectionDirection2: "",
      selectionDirection3: "",
      selectionDirection4: "",
      showColorInputs: "",
      showColorInputsToolTip: "",
      showColorPresets: "",
      showColorPresetsToolTip: "",
      showLabels: "",
      showObjects: "",
      strikethrough: "",
      strokeColor: "",
      strokeWidthPercent: "",
      styleDisagreement: "",
      toSelectObjects: "",
      toggleStyleOptionsToolTip: "",
      underline: "",
      value: "",
      valueOnly: ""
    },
    labelDisplayText: "Label Text",
    labelHidden: "Label Hidden",
    labelObjectVisibility: "Label And Object Visibility",
    labelStyleOptions: "Label Text Options",
    labelText: "Label Text",
    labelTextDecoration: "Label Text Decoration",
    labelTextFamily: "Label Text Family",
    labelTextRotation: "Label Rotation",
    labelTextScalePercent: "Label Scale",
    labelTextStyle: "Label Text Style",
    maxMinLabelDisplayCaptionLengthWarning:
      "Must be at most {max} characters long.",
    maxMinLabelDisplayTextLengthWarning:
      "Must be between 1 and {max} characters long.",
    monospace: "Monospace",
    moreThanOneItemSelected:
      "Multiple Selected Objects Detected -- Select only one.",
    moreThanOneItemSelectedToolTip:
      "More than one object is selected, please only select one geometric object to edit its label or select the label directly.",
    none: "None",
    normal: "Normal",
    objectHidden: "Object Hidden",
    opacity: "Tingkat transparansi",
    overline: "Overline",
    pointRadiusPercent: "Persentase Jejari Titik",
    renameLabels: "No Blank Labels",
    restoreDefaults: "Kembali ke tempilan standar",
    restoreDefaultsToolTip:
      "Tekan tombol ini untuk kembali ke tampilan standar",
    selectAnObject: "Pilih objek",
    selectObjectsToHide: "Select Objects to Hide",
    showColorPresets: "Warna standar",
    showColorPresetsToolTip:
      "Tekan tombol ini untuk memasukan warna HSLA atau memilih warna standar",
    stokeWidthPercent: "Persentase Tebal Garis",
    strikethrough: "Strikethrough",
    strokeColor: "Warna garis",
    underline: "Underline",
    value: "Nilai"
  },
  toolGroups: {
    AdvancedTools: "Perangkat Tambahan",
    BasicTools: "Perangkat Dasar",
    ConstructionTools: "Perangkat Konstruksi",
    DisplayTools: "Perangkat Tampilan",
    EditTools: "Suntingan",
    KeyShortCut: "Tombol",
    MeasurementTools: "",
    TransformationalTools: "Transformasi"
  }
} as LocaleMessages;
