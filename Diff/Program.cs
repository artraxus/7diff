namespace Diff
{
    using System;
    using System.Diagnostics;
    using System.IO;
    using System.Net;
    using System.Net.Mail;
    using System.Text;

    /// <summary>
    /// The program.
    /// </summary>
    public class Program
    {
        /// <summary>
        /// The capture file name.
        /// </summary>
        private const string CaptureFileName = "testdiff.png";

        /// <summary>
        /// The main.
        /// </summary>
        /// <param name="args">
        /// The args.
        /// </param>
        public static void Main(string[] args)
        {
            //TakeCapture();
            //SendEmail();
            SendToSmtp();
        }

        /// <summary>
        /// The take capture.
        /// </summary>
        public static void TakeCapture()
        {
            const string Arguments = @"C:\Workspace\Diff\Diff\rasterize.js http://www.google.com " + CaptureFileName;
            
            //// string arguments = @"C:\Workspace\Diff\Diff\capture.js http://www.google.com";
            
            var startInfo = new ProcessStartInfo
            {
                FileName = @"C:\Workspace\Diff\packages\PhantomJS.1.9.2\tools\phantomjs\phantomjs.exe",
                Arguments = Arguments,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true
            };

            var p = new Process { StartInfo = startInfo };
            p.Start();
            p.WaitForExit();

            string error = p.StandardError.ReadToEnd();
            string output = p.StandardOutput.ReadToEnd();
        }

        /// <summary>
        /// The send email.
        /// </summary>
        public static void SendEmail()
        {
            var newEmail = new MailMessage("testdiff@diff.com", "artraxus@gmail.com") { Subject = "subject", IsBodyHtml = true };

            var footerImg = new LinkedResource(CaptureFileName, "image/png") { ContentId = "capture" };

            var view = AlternateView.CreateAlternateViewFromString("<p> <img src=cid:capture /> </p>", null, "text/html");
            view.LinkedResources.Add(footerImg);

            newEmail.AlternateViews.Add(view);

            const string SmtpHost = "smtp.mandrillapp.com";

            const string SmptUserName = "clement.folliet@gmail.com";
            const string SmtpPassword = "WbsdODfw1LM6j5kP-D68jQ";

            var server = new SmtpClient(SmtpHost) { Credentials = new NetworkCredential(SmptUserName, SmtpPassword) };
            server.Send(newEmail);
        }

        /// <summary>
        /// The send to smtp.
        /// </summary>
        public static void SendToSmtp()
        {
            var uri = new Uri("ftp://s252073268.onlinehome.fr/7diff/" + CaptureFileName);
            var request = (FtpWebRequest)WebRequest.Create(uri);
            request.Credentials = new NetworkCredential("u50068133", "mp5m4a10");
            request.Method = WebRequestMethods.Ftp.UploadFile;
            
            // Copy the contents of the file to the request stream.
            var sourceStream = new StreamReader(CaptureFileName);

            var fileContents = Encoding.UTF8.GetBytes(sourceStream.ReadToEnd());
            sourceStream.Close();
            request.ContentLength = fileContents.Length;

            var requestStream = request.GetRequestStream();
            requestStream.Write(fileContents, 0, fileContents.Length);
            requestStream.Close();

            var response = (FtpWebResponse)request.GetResponse();

            Console.WriteLine("Upload File Complete, status {0}", response.StatusDescription);

            response.Close();
        }
    }
}
