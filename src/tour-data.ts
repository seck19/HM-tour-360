export type TourScene = {
  id: string
  /** Tên hạng mục, hiển thị lớn trên màn hình. */
  name: string
  /** Nhãn nhỏ phía trên tên. */
  eyebrow: string
  /** Một dòng mô tả ngắn, dùng cho danh sách và thẻ chia sẻ. */
  tagline: string
  /** Nhóm hạng mục, dùng để chia mục trong danh sách bên trái. */
  group: string
  /** Mô tả dài cho bảng thông tin. */
  description: string
  /** Các chi tiết kiến trúc đáng chú ý. */
  highlights: string[]
  /** Ảnh panorama dạng equirectangular 2:1. */
  panorama: string
  /** Ảnh nhỏ cho danh sách hạng mục. */
  thumbnail: string
  /** File thuyết minh; hạng mục chưa có bản thu sẽ bỏ trống. */
  audio?: string
  /** Góc đặt điểm nóng dẫn tới hạng mục kế tiếp. */
  linkYaw: number
  /** Góc ngẩng của điểm nóng. */
  linkPitch?: number
}

/**
 * Tuyến tham quan đi từ ngoài vào trong: nghi môn ngoại → nghi môn → đàn Thề →
 * các kiến trúc trong sân → nội tự → gò Giấu Ấn → nhà tưởng niệm trên đê.
 *
 * Nội dung kiến trúc tham chiếu hồ sơ xếp hạng di tích của Cục Di sản văn hóa
 * (di tích quốc gia đặc biệt, Quyết định 2383/QĐ-TTg ngày 09/12/2013).
 */
export const scenes: TourScene[] = [
  {
    id: 'tu-tru',
    name: 'Nghi môn ngoại',
    eyebrow: 'TỨ TRỤ · THỜI NGUYỄN',
    tagline: 'Bốn trụ gạch đắp nổi tứ linh',
    group: 'Nghi môn & sân đền',
    description:
      'Nghi môn ngoại dựng thời Nguyễn theo kiểu tứ trụ xây gạch. Đỉnh trụ đắp nổi hình tứ phượng và lân; phần lồng đèn đắp nổi tứ linh long – ly – quy – phượng; thân trụ khắc câu đối chữ Hán. Từ nghi môn theo triền đê xuống là khu đền chính, bên phải có hồ nước, bên trái đường trên mặt đê là nhà tưởng niệm nữ tướng Nguyễn Thị Định.',
    highlights: [
      'Dựng thời Nguyễn, kiểu tứ trụ xây gạch',
      'Đỉnh trụ đắp nổi tứ phượng và lân',
      'Lồng đèn đắp nổi tứ linh: long – ly – quy – phượng',
      'Thân trụ khắc câu đối chữ Hán',
    ],
    panorama: '/panoramas/hat-mon/01-tu-tru.jpg',
    thumbnail: '/panoramas/hat-mon/01-tu-tru-thumb.jpg',
    audio: '/audio/01-tu-tru.mp3',
    linkYaw: 12,
  },
  {
    id: 'nghi-mon',
    name: 'Nghi môn',
    eyebrow: 'CỔNG ĐỀN · BA GIAN CHỒNG DIÊM',
    tagline: 'Hai tầng mái, ba cửa ván bưng',
    group: 'Nghi môn & sân đền',
    description:
      'Nghi môn gồm ba gian kiểu chồng diêm, hai tầng mái. Ba cửa vào đền làm kiểu ván bưng. Các bộ vì đỡ mái kết cấu theo dạng “giá chiêng, hạ kẻ, bẩy hiên”; mái lợp ngói mũi, nền lát gạch Bát. Đây là lối vào chính của khu nội tự đền Hát Môn.',
    highlights: [
      'Ba gian, hai tầng mái kiểu chồng diêm',
      'Ba cửa vào đền kiểu ván bưng',
      'Kết cấu “giá chiêng, hạ kẻ, bẩy hiên”',
      'Mái lợp ngói mũi, nền lát gạch Bát',
    ],
    panorama: '/panoramas/hat-mon/02-nghi-mon.jpg',
    thumbnail: '/panoramas/hat-mon/02-nghi-mon-thumb.jpg',
    audio: '/audio/02-nghi-mon.mp3',
    linkYaw: 0,
  },
  {
    id: 'dan-the',
    name: 'Đàn Thề',
    eyebrow: 'ĐÀN THỀ · LỜI THỀ XUẤT QUÂN',
    tagline: 'Cột đá khắc lời thề của Hai Bà',
    group: 'Nghi môn & sân đền',
    description:
      'Đàn Thề được xây dựng mới ở phía trước cổng tam quan. Cột đá thề tạo kiểu trụ hình tháp, bốn mặt khắc chữ Hán, đặt trên nền cao hơn mặt sân 65cm, trổ năm bậc lên; mặt hướng vào đền khắc nội dung lời thề của Hai Bà Trưng. Bao quanh đàn là tường bao lửng, phía ngoài đặt các tượng voi và ngựa bằng đá.',
    highlights: [
      'Cột đá thề kiểu trụ hình tháp, bốn mặt khắc chữ Hán',
      'Mặt hướng vào đền khắc nội dung lời thề',
      'Nền cao hơn sân 65cm, trổ năm bậc',
      'Tường bao lửng, ngoài đặt tượng voi và ngựa đá',
    ],
    panorama: '/panoramas/hat-mon/03-dan-the.jpg',
    thumbnail: '/panoramas/hat-mon/03-dan-the-thumb.jpg',
    audio: '/audio/03-dan-the.mp3',
    linkYaw: -18,
  },
  {
    id: 'quan-tien',
    name: 'Quán Tiên',
    eyebrow: 'QUÁN TIÊN · GÁNH BÁNH TRÔI',
    tagline: 'Nơi bà hàng bánh dâng gánh bánh trôi',
    group: 'Kiến trúc trong sân',
    description:
      'Quán Tiên là kiến trúc nhỏ xây bằng gạch, cửa mở về hướng đền kiểu vòm cuốn, có mái đao cong, nền cao hơn mặt đường 45cm với ba bậc lên nền. Theo thần tích của làng chép lại, nơi đây vốn là quán hàng bánh trôi nước: khi nghĩa quân của Hai Bà Trưng hội tại đàn Thề, bà hàng bánh trôi đã dâng cả gánh bánh để Hai Bà ăn trước khi ra trận dẹp giặc. Ngôi quán nhỏ được dân làng dựng lên để tưởng nhớ công ơn ấy.',
    highlights: [
      'Kiến trúc nhỏ xây gạch, cửa vòm cuốn mở về hướng đền',
      'Mái đao cong, nền cao 45cm với ba bậc',
      'Tương truyền nguyên là quán bánh trôi nước',
      'Tục làm bánh trôi dâng Hai Bà còn lưu truyền đến nay',
    ],
    panorama: '/panoramas/hat-mon/04-quan-tien.jpg',
    thumbnail: '/panoramas/hat-mon/04-quan-tien-thumb.jpg',
    audio: '/audio/04-quan-tien.mp3',
    linkYaw: 22,
  },
  {
    id: 'phuong-dinh',
    name: 'Phương Đình',
    eyebrow: 'PHƯƠNG ĐÌNH · GIỮA HỒ NƯỚC',
    tagline: 'Thủy đình bốn mái đao cong',
    group: 'Kiến trúc trong sân',
    description:
      'Phương đình nằm giữa hồ nước bên phải đường đê, là điểm dừng chân ngắm cảnh của khu di tích. Kiến trúc kiểu phương đình với bốn mái đao cong vút, soi bóng xuống mặt hồ. Công trình được dựng trong giai đoạn tôn tạo gần đây, hài hoà với cảnh quan sông Hát.',
    highlights: [
      'Tọa lạc giữa hồ nước, bên phải đường đê',
      'Kiểu phương đình, bốn mái đao cong vút',
      'Điểm ngắm cảnh của khu di tích',
    ],
    panorama: '/panoramas/hat-mon/05-phuong-dinh.jpg',
    thumbnail: '/panoramas/hat-mon/05-phuong-dinh-thumb.jpg',
    audio: '/audio/05-phuong-dinh.mp3',
    linkYaw: -10,
  },
  {
    id: 'nha-khach',
    name: 'Nhà khách',
    eyebrow: 'NHÀ KHÁCH · NĂM GIAN',
    tagline: 'Tường hồi bít đốc, năm gian',
    group: 'Kiến trúc trong sân',
    description:
      'Nhà khách gồm năm gian, kiểu tường hồi bít đốc. Các bộ vì đỡ mái tạo kiểu “thượng giá chiêng, hạ kẻ, bẩy hiên”, hệ cột trốn. Đây là nơi đón tiếp khách thập phương và khách về dự lễ hội đền Hát Môn.',
    highlights: [
      'Năm gian, kiểu tường hồi bít đốc',
      'Kết cấu “thượng giá chiêng, hạ kẻ, bẩy hiên”',
      'Hệ cột trốn đỡ mái',
    ],
    panorama: '/panoramas/hat-mon/06-nha-khach.jpg',
    thumbnail: '/panoramas/hat-mon/06-nha-khach-thumb.jpg',
    audio: '/audio/06-nha-khach.mp3',
    linkYaw: 15,
  },
  {
    id: 'ta-huu-mac',
    name: 'Tả · Hữu Mạc',
    eyebrow: 'TẢ HỮU MẠC · HAI DÃY GIẢI VŨ',
    tagline: 'Hai dãy năm gian chạy dọc sân đền',
    group: 'Kiến trúc trong sân',
    description:
      'Tả mạc và hữu mạc mỗi dãy năm gian, chạy dọc theo sân đền, kiểu tường hồi bít đốc, mái lợp ngói mũi. Các bộ vì đỡ mái kết cấu dạng “giá chiêng, hạ kẻ”, được đặt lên tường bổ trụ trốn một hàng cột. Phía ngoài hai dãy là hai nhà bia kiểu phương đình, mái lợp ngói ta với bốn đầu đao cong vút.',
    highlights: [
      'Mỗi dãy năm gian chạy dọc sân đền',
      'Tường hồi bít đốc, mái lợp ngói mũi',
      'Tường bổ trụ trốn một hàng cột',
      'Hai nhà bia kiểu phương đình ở phía ngoài',
    ],
    panorama: '/panoramas/hat-mon/07-ta-huu-mac.jpg',
    thumbnail: '/panoramas/hat-mon/07-ta-huu-mac-thumb.jpg',
    audio: '/audio/07-ta-huu-mac.mp3',
    linkYaw: -6,
  },
  {
    id: 'den-chinh',
    name: 'Đền chính',
    eyebrow: 'NỘI TỰ · ĐẠI BÁI – TIỀN TẾ – HẬU CUNG',
    tagline: 'Chạm rồng, tứ linh thời Lê Trung hưng',
    group: 'Nội tự thờ tự',
    description:
      'Đền chính gồm nhà đại bái, tiền tế và hậu cung. Nhà đại bái năm gian xây gạch kiểu tường hồi bít đốc, các bộ vì kết cấu “thượng giá chiêng, chồng rường, cốn mê, bẩy hiên”, hoành mái phân “thượng tam – hạ tứ”, mái lợp ngói ri, nền lát gạch Bát. Trang trí tập trung dày đặc ở đầu dư, cốn, xà nách, bẩy, ván gió với đề tài rồng và tứ linh — sản phẩm nghệ thuật từ thời Lê Trung hưng đến thời Nguyễn. Gian giữa treo hoành phi, các cột cái đều treo câu đối ca ngợi công đức Hai Bà. Hậu cung ba gian có khám gỗ bưng kín bằng ván, là nơi thờ Hai Bà Trưng.',
    highlights: [
      'Đại bái năm gian, tiền tế năm gian, hậu cung ba gian',
      'Chạm nổi, chạm lộng đề tài rồng và tứ linh',
      'Hoành phi và câu đối ca ngợi công đức Hai Bà',
      'Khám gỗ bưng kín tại hậu cung — nơi thờ Hai Bà',
    ],
    panorama: '/panoramas/hat-mon/08-den-chinh.jpg',
    thumbnail: '/panoramas/hat-mon/08-den-chinh-thumb.jpg',
    audio: '/audio/08-den-chinh.mp3',
    linkYaw: 20,
  },
  {
    id: 'nha-tam-ngu',
    name: 'Miếu Tạm Ngự',
    eyebrow: 'MIẾU TẠM NGỰ · MẶT BẰNG CHỮ ĐINH',
    tagline: 'Nơi Thánh Bà tạm ngự mùa nước lũ',
    group: 'Nội tự thờ tự',
    description:
      'Miếu Tạm ngự nằm phía trước bên phải đền chính, có mặt bằng dạng chữ Đinh gồm tiền tế và hậu cung. Nhà tiền tế ba gian kiểu tường hồi bít đốc, mái lợp ngói mũi, bờ nóc đắp kiểu bờ đinh; các bộ vì kết cấu “giá chiêng, hạ kẻ, bẩy hiên”. Đây là nơi tạm ngự của Thánh Bà: khi mùa nước lũ hằng năm làm khu đền chính bị ngập, dân làng rước tượng, ngai thờ và toàn bộ đồ thờ tự về đây, hết mùa nước lũ lại rước Thánh hoàn cung.',
    highlights: [
      'Mặt bằng chữ Đinh: tiền tế và hậu cung',
      'Tiền tế ba gian, bờ nóc đắp kiểu bờ đinh',
      'Nơi tạm ngự của Thánh Bà trong mùa nước lũ',
      'Tục rước Thánh hoàn cung sau mùa lũ',
    ],
    panorama: '/panoramas/hat-mon/09-nha-tam-ngu.jpg',
    thumbnail: '/panoramas/hat-mon/09-nha-tam-ngu-thumb.jpg',
    audio: '/audio/09-nha-tam-ngu.mp3',
    linkYaw: -14,
  },
  {
    id: 'go-giau-an',
    name: 'Gò Giấu Ấn',
    eyebrow: 'GÒ GIẤU ẤN · DẤU TÍCH',
    tagline: 'Nơi cất giấu ấn tín trước lúc hoá thân',
    group: 'Nội tự thờ tự',
    description:
      'Gò Giấu Ấn nằm ở phía sau hậu cung đền. Tương truyền đây là dấu tích nơi Hai Bà Trưng cất giấu ấn tín trước lúc rút quân và hoá thân về cõi vĩnh hằng ở cửa sông Hát. Hiện nay gò đã được bó vỉa và xây tường gạch bao quanh.',
    highlights: [
      'Nằm ở phía sau hậu cung đền chính',
      'Dấu tích nơi cất giấu ấn tín',
      'Đã được bó vỉa và xây tường gạch bao quanh',
    ],
    panorama: '/panoramas/hat-mon/10-go-giau-an.jpg',
    thumbnail: '/panoramas/hat-mon/10-go-giau-an-thumb.jpg',
    audio: '/audio/10-go-giau-an.mp3',
    linkYaw: 8,
  },
  {
    id: 'nha-tuong-niem-nguyen-thi-dinh',
    name: 'Nhà tưởng niệm Nguyễn Thị Định',
    eyebrow: 'TƯỞNG NIỆM · NỮ TƯỚNG NGUYỄN THỊ ĐỊNH',
    tagline: 'Nhà tưởng niệm bên mặt đê',
    group: 'Tưởng niệm',
    description:
      'Nhà tưởng niệm nữ tướng – nữ anh hùng Nguyễn Thị Định nằm bên trái đường trên mặt đê, thuộc quần thể di tích đền Hát Môn. Công trình tưởng niệm vị nữ tướng đầu tiên của lực lượng vũ trang nhân dân miền Nam, người con của Bến Tre, nối tiếp mạch tôn vinh những người phụ nữ Việt Nam anh hùng bên cạnh nơi thờ Hai Bà Trưng.',
    highlights: [
      'Bên trái đường trên mặt đê',
      'Tưởng niệm nữ tướng Nguyễn Thị Định',
      'Nối tiếp truyền thống tôn vinh phụ nữ Việt Nam anh hùng',
    ],
    panorama: '/panoramas/hat-mon/11-nha-tuong-niem-nguyen-thi-dinh.jpg',
    thumbnail: '/panoramas/hat-mon/11-nha-tuong-niem-nguyen-thi-dinh-thumb.jpg',
    audio: '/audio/11-nha-tuong-niem-nguyen-thi-dinh.mp3',
    linkYaw: 0,
  },
]

/** Nhóm hạng mục theo đúng thứ tự xuất hiện trong tuyến tham quan. */
export const sceneGroups = scenes.reduce<Array<{ name: string; scenes: TourScene[] }>>((groups, scene) => {
  const last = groups[groups.length - 1]
  if (last && last.name === scene.group) last.scenes.push(scene)
  else groups.push({ name: scene.group, scenes: [scene] })
  return groups
}, [])

export const sceneIndexById = (id: string) => scenes.findIndex((scene) => scene.id === id)

export const getSceneFromUrl = () => {
  const id = new URLSearchParams(window.location.search).get('scene')
  return sceneIndexById(id ?? '') >= 0 ? id! : scenes[0].id
}
