import bcrypt from 'bcryptjs';
import { pool } from './schema';

export async function seedDatabase() {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM users');
  if (parseInt(rows[0].count) > 0) return;

  console.log('Seeding database...');

  const pw = await bcrypt.hash('password123', 10);

  const insertUser = (email: string, hash: string, role: string, name: string, phone: string, location: string, years: number, bio: string, skills: string) =>
    pool.query(
      `INSERT INTO users (email, password_hash, role, name, phone, location, experience_years, bio, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [email, hash, role, name, phone, location, years, bio, skills]
    );

  await insertUser('admin@freshersworld.com', pw, 'admin', 'Admin User', '9999999999', 'Chennai', 5, 'Site administrator', '[]');
  await insertUser('employer1@tcs.com', pw, 'employer', 'TCS HR Team', '9876543210', 'Chennai', 8, 'HR Manager at TCS', '[]');
  await insertUser('employer2@infosys.com', pw, 'employer', 'Infosys Recruiter', '9876543211', 'Bangalore', 6, 'Talent Acquisition at Infosys', '[]');
  await insertUser('employer3@wipro.com', pw, 'employer', 'Wipro HR', '9876543212', 'Bangalore', 7, 'HR at Wipro', '[]');
  await insertUser('employer4@hcl.com', pw, 'employer', 'HCL Recruiter', '9876543213', 'Noida', 5, 'HR at HCL', '[]');
  await insertUser('employer5@cognizant.com', pw, 'employer', 'Cognizant HR', '9876543214', 'Chennai', 4, 'Recruiter at Cognizant', '[]');
  await insertUser('employer6@amazon.com', pw, 'employer', 'Amazon India HR', '9876543215', 'Hyderabad', 9, 'HR at Amazon', '[]');
  await insertUser('employer7@flipkart.com', pw, 'employer', 'Flipkart Recruiter', '9876543216', 'Bangalore', 6, 'Talent Acquisition at Flipkart', '[]');

  const seekers: [string, string, string, string, string, string, number, string, string][] = [
    ['seeker1@gmail.com', pw, 'jobseeker', 'Rahul Sharma', '8765432100', 'Delhi', 0, 'Fresh B.Tech graduate looking for opportunities', '["Java","Python","SQL"]'],
    ['seeker2@gmail.com', pw, 'jobseeker', 'Priya Patel', '8765432101', 'Mumbai', 0, 'BCA graduate passionate about web development', '["React","JavaScript","HTML","CSS"]'],
    ['seeker3@gmail.com', pw, 'jobseeker', 'Amit Kumar', '8765432102', 'Bangalore', 1, 'MBA fresher with finance background', '["Excel","Financial Analysis","Tally"]'],
    ['seeker4@gmail.com', pw, 'jobseeker', 'Sneha Reddy', '8765432103', 'Hyderabad', 0, 'B.Tech CSE fresher', '["C++","Java","Data Structures"]'],
    ['seeker5@gmail.com', pw, 'jobseeker', 'Vikram Singh', '8765432104', 'Pune', 0, 'Looking for internship opportunities', '["Python","Machine Learning","NumPy"]'],
  ];
  for (const s of seekers) await insertUser(...s);

  const insertCompany = (uid: number, name: string, logo: string, website: string, industry: string, size: string, desc: string, loc: string, verified: boolean, rating: number, reviews: number) =>
    pool.query(
      `INSERT INTO companies (user_id, name, logo_url, website, industry, size, description, location, is_verified, rating, review_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [uid, name, logo, website, industry, size, desc, loc, verified, rating, reviews]
    );

  await insertCompany(2, 'Tata Consultancy Services', 'https://logo.clearbit.com/tcs.com', 'https://www.tcs.com', 'IT Services', '100,000+', "TCS is an IT services, consulting and business solutions organization that has been partnering with many of the world's largest businesses in their transformation journeys for over 50 years.", 'Chennai, Tamil Nadu', true, 4.1, 12430);
  await insertCompany(3, 'Infosys', 'https://logo.clearbit.com/infosys.com', 'https://www.infosys.com', 'IT Services', '100,000+', 'Infosys is a global leader in next-generation digital services and consulting. We enable clients in more than 50 countries to navigate their digital transformation.', 'Bangalore, Karnataka', true, 3.9, 9875);
  await insertCompany(4, 'Wipro', 'https://logo.clearbit.com/wipro.com', 'https://www.wipro.com', 'IT Services', '50,000-100,000', 'Wipro Limited is a leading global information technology, consulting and business process services company.', 'Bangalore, Karnataka', true, 3.8, 7654);
  await insertCompany(5, 'HCL Technologies', 'https://logo.clearbit.com/hcltech.com', 'https://www.hcltech.com', 'IT Services', '50,000-100,000', 'HCL Technologies is a next-generation global technology company that helps enterprises reimagine their businesses for the digital age.', 'Noida, Uttar Pradesh', true, 3.9, 6543);
  await insertCompany(6, 'Cognizant', 'https://logo.clearbit.com/cognizant.com', 'https://www.cognizant.com', 'IT Services', '50,000-100,000', "Cognizant is one of the world's leading professional services companies, transforming clients' business, operating, and technology models.", 'Chennai, Tamil Nadu', true, 3.7, 8234);
  await insertCompany(7, 'Amazon India', 'https://logo.clearbit.com/amazon.com', 'https://www.amazon.in', 'E-Commerce', '10,000-50,000', 'Amazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking.', 'Hyderabad, Telangana', true, 4.3, 5432);
  await insertCompany(8, 'Flipkart', 'https://logo.clearbit.com/flipkart.com', 'https://www.flipkart.com', 'E-Commerce', '10,000-50,000', 'Flipkart is an Indian e-commerce company, headquartered in Bangalore, Karnataka, India, and incorporated in Singapore as a private limited company.', 'Bangalore, Karnataka', true, 4.0, 4321);

  const jobSql = `INSERT INTO jobs (company_id, title, description, type, category, location, salary_min, salary_max,
    experience_min, experience_max, qualifications, skills_required, openings, is_active, is_featured, deadline, views)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`;

  const jobs: any[][] = [
    [1, 'Software Engineer - Fresher', `TCS is hiring fresh graduates for the role of Software Engineer. Selected candidates will be part of TCS's prestigious training program (ILP - Initial Learning Program) before being deployed to client projects.\n\nResponsibilities:\n- Develop and maintain software applications\n- Participate in code reviews and testing\n- Collaborate with cross-functional teams\n- Follow TCS best practices and coding standards\n\nWhat we offer:\n- Structured onboarding with 3-month ILP training\n- Competitive salary package\n- Health insurance for self and family\n- Global opportunities after 2 years`, 'fulltime', 'IT', 'Pan India', 350000, 450000, 0, 1, 'B.E/B.Tech/MCA/M.Sc (CS/IT)', '["Java","Python","C++","SQL"]', 2000, true, true, '2026-06-30', 8543],
    [1, 'System Engineer', `Join TCS as a System Engineer and work on cutting-edge technology projects for global clients.\n\nKey Responsibilities:\n- Design, develop and maintain software solutions\n- Work with clients to gather requirements\n- Perform testing and quality assurance\n- Document technical specifications`, 'fulltime', 'IT', 'Bangalore, Karnataka', 350000, 480000, 0, 2, 'B.E/B.Tech in CS/IT/ECE', '["Java","Spring Boot","SQL","REST APIs"]', 500, true, false, '2026-05-31', 3421],
    [1, 'Junior Data Analyst', `TCS is looking for data-driven freshers to join our analytics team.\n\nYou will work on:\n- Data cleaning and preprocessing\n- Building dashboards and reports\n- Statistical analysis\n- Working with BI tools like Tableau, Power BI`, 'fulltime', 'Analytics', 'Hyderabad, Telangana', 400000, 550000, 0, 2, 'B.E/B.Tech/M.Sc Statistics/Math', '["Python","SQL","Excel","Tableau"]', 100, true, true, '2026-06-15', 5672],
    [2, 'Systems Engineer', `Infosys is hiring fresh graduates for our Systems Engineer role. You will be trained extensively and then deployed to work on enterprise-level projects.\n\nResponsibilities:\n- Software development in Java/.NET technologies\n- Agile methodology and sprint planning participation\n- Unit testing and bug fixing\n- Technical documentation`, 'fulltime', 'IT', 'Pune, Maharashtra', 380000, 480000, 0, 1, 'B.E/B.Tech/M.Tech/MCA', '["Java",".NET","SQL","Agile"]', 1500, true, true, '2026-07-31', 7234],
    [2, 'Digital Specialist Engineer', `Work on next-gen digital technologies at Infosys.\n\nYou will learn and work on:\n- Cloud platforms (AWS/Azure/GCP)\n- DevOps tools (Docker, Kubernetes, Jenkins)\n- Microservices architecture\n- API development`, 'fulltime', 'IT', 'Bangalore, Karnataka', 450000, 600000, 0, 2, 'B.E/B.Tech CSE/IT', '["Cloud","Docker","Kubernetes","Python"]', 300, true, false, '2026-06-30', 4532],
    [3, 'Project Engineer', `Wipro is hiring freshers for its Project Engineer program.\n\nRole overview:\n- Work on software development projects\n- Client interaction and requirement gathering\n- Testing and QA activities\n- Continuous learning and certification`, 'fulltime', 'IT', 'Chennai, Tamil Nadu', 350000, 450000, 0, 1, 'B.E/B.Tech (CS/IT/ECE/EEE)', '["C","C++","Java","SQL"]', 800, true, false, '2026-05-31', 3123],
    [4, 'Graduate Engineer Trainee', `HCL Technologies is looking for passionate fresh graduates.\n\nYou will:\n- Undergo 6-month training on latest technologies\n- Work on real client projects\n- Gain exposure to global delivery model\n- Get mentored by senior engineers`, 'fulltime', 'IT', 'Noida, Uttar Pradesh', 320000, 420000, 0, 1, 'B.E/B.Tech any stream', '["Any","Aptitude","Communication"]', 1000, true, true, '2026-08-31', 5901],
    [6, 'Software Development Engineer Intern', `Amazon India is offering a 6-month internship for final year students and recent graduates.\n\nWhat you'll do:\n- Build features for Amazon's e-commerce platform\n- Write clean, efficient, and well-documented code\n- Participate in design discussions\n- Collaborate with senior engineers\n\nPotential for Pre-Placement Offer!`, 'internship', 'IT', 'Hyderabad, Telangana', 50000, 80000, 0, 0, 'B.E/B.Tech CSE/IT (Final year or 2024 passout)', '["Data Structures","Algorithms","Java","Python"]', 50, true, true, '2026-05-15', 12453],
    [6, 'Operations Intern', `Amazon Fulfillment Center Operations Internship.\n\nYou will:\n- Learn warehouse management operations\n- Analyze operational metrics\n- Suggest process improvements\n- Work with cross-functional teams`, 'internship', 'Operations', 'Bangalore, Karnataka', 25000, 35000, 0, 0, 'B.E/MBA (Operations/SCM)', '["Excel","Operations","Analytical"]', 30, true, false, '2026-05-31', 3421],
    [7, 'Software Development Engineer - Fresher', `Flipkart is hiring fresh engineers to join our tech team.\n\nWhat you will work on:\n- Building scalable backend services\n- Frontend development with React\n- Mobile app development\n- Data engineering and analytics`, 'fulltime', 'IT', 'Bangalore, Karnataka', 550000, 750000, 0, 1, 'B.E/B.Tech CSE/IT from Tier-1/2 colleges', '["Java","React","System Design","Algorithms"]', 100, true, true, '2026-06-30', 9871],
    [2, 'HR Trainee', `Infosys HR team is looking for MBA freshers to join as HR Trainees.\n\nResponsibilities:\n- Assist in recruitment and onboarding\n- Employee engagement activities\n- HR data management\n- Learning and Development support`, 'fulltime', 'HR', 'Chennai, Tamil Nadu', 300000, 400000, 0, 1, 'MBA (HR)', '["Communication","Excel","Recruitment","HRMS"]', 50, true, false, '2026-06-15', 2134],
    [3, 'Finance Analyst - Fresher', `Wipro Finance team is hiring fresh CA/MBA graduates.\n\nKey areas:\n- Financial reporting and analysis\n- Accounts payable/receivable management\n- Monthly closing activities\n- Variance analysis`, 'fulltime', 'Finance', 'Hyderabad, Telangana', 400000, 550000, 0, 2, 'CA/MBA Finance/CMA', '["Finance","SAP","Excel","Accounting"]', 30, true, false, '2026-05-31', 1876],
    [1, 'Walk-in Drive: Junior Software Developer', `TCS is conducting a walk-in drive for Junior Software Developer positions.\n\nWalk-in Date: Every Saturday 10 AM - 4 PM\nVenue: TCS Offices across major cities\n\nRequirements:\n- 2024/2025 passed out students\n- Good understanding of programming concepts\n- Willing to relocate`, 'walkin', 'IT', 'Pan India', 300000, 420000, 0, 1, 'B.E/B.Tech any stream', '["Java","C++","Problem Solving"]', 500, true, true, '2026-05-31', 6721],
    [4, 'Walk-in: Customer Support Executive', `HCL is conducting a walk-in drive for Customer Support roles.\n\nWalk-in: Every weekday, 9 AM - 5 PM\nVenue: HCL Noida campus\n\nProfile:\n- Strong communication skills\n- Willingness to work in shifts\n- Basic computer knowledge`, 'walkin', 'BPO', 'Noida, Uttar Pradesh', 220000, 320000, 0, 1, 'Any Graduate', '["Communication","English","Computer Basics"]', 200, true, false, '2026-05-31', 4532],
    [1, 'Government: Junior Programmer', `National Informatics Centre (NIC) recruitment for Junior Programmer positions under the Central Government of India.\n\nSelection Process:\n1. Written Examination\n2. Skill Test\n3. Interview\n\nBenefits:\n- Grade Pay: ₹4,200\n- DA, HRA, TA and other allowances\n- Job security and pension\n- 5-day work week`, 'govt', 'IT', 'Delhi', 450000, 600000, 0, 3, 'B.E/B.Tech CS/IT/MCA', '["C","Java","Database","Networking"]', 100, true, true, '2026-06-30', 15234],
    [2, 'Government: Probationary Officer', `State Bank of India (SBI) IBPS PO Recruitment 2026.\n\nProbationary Officers (POs) are among the most coveted government bank positions.\n\nEligibility:\n- Any Graduate with 60% marks\n- Age: 20-30 years\n\nSelection: Prelims → Mains → Interview\n\nBenefits:\n- Starting salary: ₹36,000/month\n- DA, HRA, CCA allowances\n- Pension benefits`, 'govt', 'Banking', 'Pan India', 432000, 600000, 0, 3, 'Any Graduate (60%+ marks)', '["Quantitative Aptitude","Reasoning","English","Banking"]', 2000, true, true, '2026-07-31', 23456],
    [5, 'Marketing Intern', `Cognizant is looking for a Marketing Intern for 3-6 months.\n\nYou will:\n- Support digital marketing campaigns\n- Create social media content\n- Assist in market research\n- Help with brand communications`, 'internship', 'Marketing', 'Chennai, Tamil Nadu', 15000, 25000, 0, 0, 'MBA Marketing / B.Com / BBA (Final year)', '["Social Media","Excel","Communication","Creativity"]', 10, true, false, '2026-05-31', 2134],
    [6, 'Data Science Intern', `Amazon ML team offering Data Science internship.\n\nProjects you may work on:\n- Customer behaviour prediction\n- Recommendation systems\n- Supply chain optimization using ML\n- NLP for product reviews`, 'internship', 'Analytics', 'Hyderabad, Telangana', 40000, 60000, 0, 0, 'B.Tech/M.Tech/M.Sc in CS/Statistics/Math', '["Python","Machine Learning","SQL","Statistics"]', 20, true, true, '2026-05-15', 8765],
    [7, 'Business Analyst - Fresher', `Flipkart is hiring fresh MBA graduates for Business Analyst roles.\n\nYou will:\n- Analyze business metrics and KPIs\n- Create dashboards and reports\n- Work with product and tech teams\n- Drive data-informed decisions`, 'fulltime', 'Analytics', 'Bangalore, Karnataka', 700000, 900000, 0, 1, 'MBA from Tier-1 college / B.Tech + MBA', '["SQL","Excel","PowerBI","Problem Solving"]', 30, true, false, '2026-06-30', 5432],
    [3, 'Network Engineer - Fresher', `Wipro is hiring fresh CCNA/CCNP certified engineers.\n\nResponsibilities:\n- Network infrastructure maintenance\n- Troubleshooting connectivity issues\n- Router and switch configuration\n- Security implementation`, 'fulltime', 'IT', 'Bangalore, Karnataka', 280000, 400000, 0, 2, 'B.E/B.Tech ECE/IT with CCNA certification', '["Networking","CCNA","Routing","Switching"]', 60, true, false, '2026-06-15', 3241],
  ];

  for (const j of jobs) await pool.query(jobSql, j);

  const courseSql = `INSERT INTO courses (title, provider, category, description, duration, price, rating, enrollments, thumbnail_url, url, is_featured)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`;

  const courses: any[][] = [
    ['Full Stack Web Development Bootcamp', 'Udemy', 'IT', 'Complete web dev course covering HTML, CSS, JS, React, Node.js and databases', '54 hours', 499, 4.7, 345000, 'https://img-c.udemycdn.com/course/480x270/625204_436a_3.jpg', '#', true],
    ['Python for Data Science and ML', 'Coursera', 'Analytics', 'Learn Python, NumPy, Pandas, Matplotlib, Scikit-learn for data science', '6 weeks', 0, 4.6, 234000, 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://s3.amazonaws.com/coursera-course-photos/bf/62bba5b6ba11e98b143b96c2db74d0/Logo_Python-for-Data-Science-and-AI-_1000x1000.png', '#', true],
    ['AWS Cloud Practitioner', 'AWS', 'Cloud', 'Become AWS Cloud Practitioner certified. Learn EC2, S3, RDS, Lambda and more', '40 hours', 3000, 4.5, 123000, 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Cloud-Practitioner_badge.634f8a21af2e0e956ed8905a72366146ba22b74c.png', '#', true],
    ['Core Java Masterclass', 'NPTEL', 'IT', 'Complete Java programming from basics to advanced OOP concepts', '12 weeks', 0, 4.4, 456000, 'https://upload.wikimedia.org/wikipedia/en/1/13/Nptel_new_logo.jpg', '#', true],
    ['Digital Marketing Fundamentals', 'Google', 'Marketing', 'Free Google Digital Marketing course covering SEO, SEM, Social Media marketing', '40 hours', 0, 4.3, 567000, 'https://skillshop.exceedlms.com/uploads/resource_courses/targets/634885/original/cover.png', '#', true],
    ['Data Analytics with Excel & PowerBI', 'Microsoft', 'Analytics', 'Learn to analyze data and create compelling dashboards with Excel and Power BI', '8 weeks', 0, 4.5, 234000, 'https://powerbi.microsoft.com/pictures/application-logos/svg/powerbi.svg', '#', true],
    ['React JS - Complete Guide', 'Udemy', 'IT', 'Build powerful, fast, user-friendly and reactive web apps', '48 hours', 399, 4.7, 289000, 'https://img-c.udemycdn.com/course/480x270/1362070_b9a1_2.jpg', '#', false],
    ['Machine Learning A-Z', 'Udemy', 'Analytics', 'Learn Machine Learning algorithms from basics to advanced techniques', '44 hours', 499, 4.5, 876000, 'https://img-c.udemycdn.com/course/480x270/950390_270f_3.jpg', '#', true],
    ['English Communication Skills', 'Coursera', 'Soft Skills', 'Improve your English communication for professional settings', '4 weeks', 0, 4.2, 345000, 'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/https://s3.amazonaws.com/coursera-course-photos/e3/84fe90b36d11e8bcaab3e5b73e2a41/English-for-Career-Development-by-University-of-Pennsylvania.jpg', '#', false],
    ['Tally ERP 9 & GST', 'Tally Solutions', 'Finance', 'Master Tally ERP 9 with GST for accounting and finance careers', '30 hours', 1500, 4.3, 123000, 'https://tallysolutions.com/wp-content/uploads/2021/10/tally-logo.svg', '#', false],
  ];

  for (const c of courses) await pool.query(courseSql, c);

  const appSql = `INSERT INTO applications (job_id, user_id, status, cover_letter) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`;
  await pool.query(appSql, [1, 9, 'pending', 'I am very interested in this position at TCS...']);
  await pool.query(appSql, [4, 9, 'reviewed', 'I would love to be part of the Infosys team...']);
  await pool.query(appSql, [8, 9, 'shortlisted', 'Amazon has been my dream company...']);
  await pool.query(appSql, [10, 10, 'pending', 'Flipkart is building the future of e-commerce...']);

  const bmSql = 'INSERT INTO bookmarks (user_id, job_id) VALUES ($1,$2) ON CONFLICT DO NOTHING';
  await pool.query(bmSql, [9, 1]);
  await pool.query(bmSql, [9, 4]);
  await pool.query(bmSql, [9, 8]);
  await pool.query(bmSql, [9, 10]);
  await pool.query(bmSql, [10, 8]);
  await pool.query(bmSql, [10, 10]);

  const revSql = `INSERT INTO company_reviews (company_id, user_id, rating, title, review, pros, cons)
    VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`;
  await pool.query(revSql, [1, 9, 4, 'Great company to start career', 'TCS provides excellent training and exposure to diverse projects. The ILP program is very structured.', 'Good training, job security, brand name', 'Slow promotions, politics in some teams']);
  await pool.query(revSql, [2, 10, 4, 'Good work life balance at Infosys', 'Infosys has good facilities and a supportive work environment. The managers are generally good.', 'Work-life balance, learning opportunities, campus', 'Salary growth is slow']);

  const ratingUpdates = [
    [4.1, 12430, 1], [3.9, 9875, 2], [3.8, 7654, 3],
    [3.9, 6543, 4], [3.7, 8234, 5], [4.3, 5432, 6], [4.0, 4321, 7],
  ];
  for (const [rating, review_count, id] of ratingUpdates) {
    await pool.query('UPDATE companies SET rating = $1, review_count = $2 WHERE id = $3', [rating, review_count, id]);
  }

  console.log('Database seeded successfully!');
}
